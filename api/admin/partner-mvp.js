const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const SUPABASE_TIMEOUT_MS = 10000;
const SUPABASE_AUTH_TIMEOUT_MS = 7000;
const ACTIVITY_LOG_TIMEOUT_MS = 3000;
const EXTERNAL_REQUEST_TIMEOUT_MS = 10000;

const CASE_STATUS_FALLBACK = {
  matched: "matching_ready",
  treated: "visited",
  aftercare: "visited",
  closed_won: "booking_confirmed",
};

const CASE_STATUSES = new Set([
  "new",
  "qualified",
  "intake_completed",
  "matching_ready",
  "matched",
  "quote_requested",
  "quote_sent",
  "deposit_pending",
  "deposit_paid",
  "booking_confirmed",
  "visited",
  "treated",
  "aftercare",
  "closed_won",
  "closed_lost",
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(res, status, payload) {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function readToken(req) {
  const bearer = getHeader(req, "authorization")?.replace(/^Bearer\s+/i, "").trim();
  return bearer || getHeader(req, "x-admin-token")?.trim() || "";
}

function parseTokenMap(raw) {
  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Map(
        parsed
          .map((row) => [String(row.token || "").trim(), String(row.accountId || row.partnerId || row.providerId || "").trim()])
          .filter(([token, accountId]) => token && accountId),
      );
    }

    if (parsed && typeof parsed === "object") {
      return new Map(
        Object.entries(parsed)
          .map(([token, accountId]) => [String(token).trim(), String(accountId || "").trim()])
          .filter(([token, accountId]) => token && accountId),
      );
    }
  } catch (error) {
    console.warn("Role token map could not be parsed.", error);
  }

  return new Map();
}

function readRoleTokenConfig() {
  const partnerMap = parseTokenMap(process.env.PARTNER_TOKEN_MAP || process.env.PARTNER_API_TOKEN_MAP);
  const providerMap = parseTokenMap(process.env.PROVIDER_TOKEN_MAP || process.env.PROVIDER_API_TOKEN_MAP);
  return {
    adminToken: process.env.ADMIN_API_TOKEN?.trim() || "",
    partnerToken: process.env.PARTNER_API_TOKEN?.trim() || "",
    providerToken: process.env.PROVIDER_API_TOKEN?.trim() || "",
    partnerMap,
    providerMap,
  };
}

async function verifySupabaseAuthUser(config, accessToken) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) return null;

    const text = await response.text();
    const body = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(body?.message || body?.error_description || text || `Supabase Auth verification failed with ${response.status}`);
    }

    const user = body?.user || body;
    const email = String(user?.email || "").trim().toLowerCase();
    if (!user?.id || !email) return null;
    return { id: user.id, email };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Supabase Auth verification timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeAccessRole(value) {
  return value === "partner" || value === "provider" ? value : value === "admin" ? "admin" : "";
}

async function readEmailRoleAccess(config, email) {
  try {
    const rows = await supabaseFetch(
      config,
      `ops_user_access?select=id,email,role,partner_id,provider_id,active&email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`,
    );
    return rows[0] || null;
  } catch (error) {
    if (String(error?.message || "").includes("ops_user_access")) {
      throw new HttpError(503, "ops_user_access migration is not applied.");
    }
    throw error;
  }
}

async function resolveRoleAccess(req, config) {
  const roleTokens = readRoleTokenConfig();
  const suppliedToken = readToken(req);

  if (!suppliedToken) {
    return { error: "Unauthorized.", status: 401 };
  }

  if (roleTokens.adminToken && suppliedToken === roleTokens.adminToken) {
    return { role: "admin", roleTokens, scopedAccountId: null, authMethod: "legacy_token", authEmail: null };
  }

  if (roleTokens.partnerMap.has(suppliedToken)) {
    return {
      role: "partner",
      roleTokens,
      partnerId: roleTokens.partnerMap.get(suppliedToken),
      scopedAccountId: roleTokens.partnerMap.get(suppliedToken),
      authMethod: "legacy_token",
      authEmail: null,
    };
  }

  if (roleTokens.providerMap.has(suppliedToken)) {
    return {
      role: "provider",
      roleTokens,
      providerId: roleTokens.providerMap.get(suppliedToken),
      scopedAccountId: roleTokens.providerMap.get(suppliedToken),
      authMethod: "legacy_token",
      authEmail: null,
    };
  }

  if (roleTokens.partnerToken && suppliedToken === roleTokens.partnerToken) {
    return { role: "partner", roleTokens, scopedAccountId: null, authMethod: "legacy_token", authEmail: null };
  }

  if (roleTokens.providerToken && suppliedToken === roleTokens.providerToken) {
    return { role: "provider", roleTokens, scopedAccountId: null, authMethod: "legacy_token", authEmail: null };
  }

  const user = await verifySupabaseAuthUser(config, suppliedToken);
  if (!user) return { error: "Unauthorized.", status: 401 };

  const access = await readEmailRoleAccess(config, user.email);
  if (!access) return { error: "This email is not allowed for operations access.", status: 403 };

  const role = normalizeAccessRole(access.role);
  if (!role) return { error: "This email has an unsupported operations role.", status: 403 };
  if (role === "partner" && !access.partner_id) return { error: "Partner operations access requires a partner_id.", status: 403 };
  if (role === "provider" && !access.provider_id) return { error: "Provider operations access requires a provider_id.", status: 403 };

  return {
    role,
    roleTokens,
    partnerId: access.partner_id || undefined,
    providerId: access.provider_id || undefined,
    scopedAccountId: access.partner_id || access.provider_id || null,
    authMethod: "email",
    authEmail: user.email,
  };
}

async function requireConfig(req, allowedRoles = ["admin"]) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Supabase server credentials are not configured.", status: 503 };
  }

  const baseConfig = {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
  };

  const access = await resolveRoleAccess(req, baseConfig);
  if (access.error) return access;

  if (access.role !== "admin" && !allowedRoles.includes(access.role)) {
    return { error: "This role is not allowed to perform this operation.", status: 403 };
  }

  return {
    ...baseConfig,
    role: access.role,
    partnerId: access.partnerId,
    providerId: access.providerId,
    scopedAccountId: access.scopedAccountId,
    roleTokens: access.roleTokens,
    authMethod: access.authMethod,
    authEmail: access.authEmail,
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function inFilter(values) {
  return `in.(${values.join(",")})`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function supabaseFetch(config, path, init = {}) {
  const { headers, prefer, timeoutMs = SUPABASE_TIMEOUT_MS, ...fetchInit } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      ...fetchInit,
      signal: controller.signal,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
        ...(headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Supabase request timed out: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message || body?.hint || text || `Supabase request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
}

async function supabaseCount(config, table) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?select=id`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });

    if (!response.ok) return null;

    const contentRange = response.headers.get("content-range") || "";
    const total = Number(contentRange.split("/")[1]);
    return Number.isFinite(total) ? total : null;
  } catch (error) {
    console.warn(`Supabase count skipped for ${table}.`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getLeadStorageHealth(config) {
  const [patients, leads, cases, medicalIntakes, latestLeads] = await Promise.all([
    supabaseCount(config, "patients"),
    supabaseCount(config, "leads"),
    supabaseCount(config, "cases"),
    supabaseCount(config, "medical_intakes"),
    safeList(config, "leads", "select=created_at&order=created_at.desc&limit=1"),
  ]);

  const latestLeadAt = latestLeads[0]?.created_at || null;
  const v1PipelineReady =
    patients !== null &&
    leads !== null &&
    cases !== null &&
    medicalIntakes !== null &&
    leads > 0 &&
    patients >= leads &&
    cases <= leads &&
    medicalIntakes <= cases;

  return {
    patients,
    leads,
    cases,
    medicalIntakes,
    latestLeadAt,
    v1PipelineReady,
    checkedAt: new Date().toISOString(),
  };
}

async function getAdminPersistenceHealth(config) {
  const [adminLandingRoutes, contactChannels, providerOperatingProfiles, providerDataQualityChecks, notificationOutbox] = await Promise.all([
    supabaseCount(config, "admin_landing_routes"),
    supabaseCount(config, "contact_channel_settings"),
    supabaseCount(config, "provider_operating_profiles"),
    supabaseCount(config, "provider_data_quality_checks"),
    supabaseCount(config, "notification_outbox"),
  ]);

  return {
    adminLandingRoutes,
    contactChannels,
    providerOperatingProfiles,
    providerDataQualityChecks,
    notificationOutbox,
    ready:
      adminLandingRoutes !== null &&
      contactChannels !== null &&
      providerOperatingProfiles !== null &&
      providerDataQualityChecks !== null &&
      notificationOutbox !== null,
    checkedAt: new Date().toISOString(),
  };
}

async function list(config, table, query) {
  return supabaseFetch(config, `${table}?${query}`);
}

async function safeList(config, table, query) {
  try {
    return await list(config, table, query);
  } catch (error) {
    console.warn(`Optional Supabase list skipped for ${table}.`, error);
    return [];
  }
}

async function logActivity(config, { caseId, actorRole = "admin", actorLabel = "Operations", eventType, eventPayload = {} }) {
  if (!caseId || !eventType) return;
  try {
    await supabaseFetch(config, "case_activity_events", {
      method: "POST",
      body: JSON.stringify({
        case_id: caseId,
        actor_role: actorRole,
        actor_label: actorLabel,
        event_type: eventType,
        event_payload: eventPayload,
      }),
      prefer: "return=minimal",
      timeoutMs: ACTIVITY_LOG_TIMEOUT_MS,
    });
  } catch (error) {
    console.warn("Optional case activity insert skipped.", error);
  }
}

function displayName(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.en || value.ko || value.ja || Object.values(value)[0] || fallback;
}

function normalizeStatus(status) {
  return CASE_STATUS_FALLBACK[status] || status || "qualified";
}

function marketFromLead(lead) {
  const attribution = lead?.attribution || {};
  return (attribution.market || lead?.residence_country || lead?.nationality || "global").toString().toLowerCase();
}

function localeFromLead(lead) {
  const language = (lead?.preferred_language || "en").toLowerCase();
  return language.startsWith("ja") ? "jp" : "en";
}

function nextActionFor(row) {
  if (row.quoteRequestedProviderIds.length) return "Provider quote SLA check";
  if (row.partnerShortlistedProviderIds.length) return "Coordinator to request quotes from partner shortlist";
  if (row.assignedPartnerId) return "Partner should select provider candidates";
  if (row.partnerAssistanceMode !== "platform_direct") return "Assign partner for requested services";
  return "Continue coordinator qualification";
}

function normalizeCase({ request, lead, caseRow, intake, assignment, shortlists, quoteRequests }) {
  const riskFlags = intake?.risk_flags || {};
  const requestedServices = request?.requested_services || riskFlags.partner_services || [];
  const shortlisted = shortlists
    .filter((row) => row.selection_status !== "excluded" && row.selection_status !== "rejected")
    .map((row) => row.provider_id);
  const quoteRequested = Array.from(
    new Set([
      ...shortlists.filter((row) => row.selection_status === "quote_requested").map((row) => row.provider_id),
      ...quoteRequests.map((row) => row.provider_id),
    ]),
  );
  const partnerAssistanceMode = request?.assistance_mode || riskFlags.partner_assistance_mode || "platform_direct";
  const currency = lead?.currency || intake?.currency || "USD";
  const row = {
    id: caseRow?.id || request?.case_id || request?.id,
    leadId: lead?.id || request?.lead_id || "",
    patientAlias: lead?.name || `Case ${(caseRow?.id || request?.case_id || request?.id || "").slice(0, 8)}`,
    owner: "Coordinator",
    status: normalizeStatus(caseRow?.status),
    priority: caseRow?.priority || "normal",
    locale: localeFromLead(lead),
    market: marketFromLead(lead),
    source: lead?.source || caseRow?.source || "site",
    campaign: lead?.attribution?.campaign || lead?.attribution?.utm_campaign || "direct",
    landingPath: lead?.attribution?.source_landing || lead?.attribution?.current_path || "/consultation",
    packageId: lead?.attribution?.package_interest || riskFlags.package_interest || "custom-request",
    procedure: lead?.treatment_interest || lead?.attribution?.package_interest || "Consultation request",
    language: lead?.preferred_language || "en",
    budgetMinUsd: Number(lead?.budget_min || intake?.budget_min || 0),
    budgetMaxUsd: Number(lead?.budget_max || intake?.budget_max || 0),
    travelStart: intake?.travel_start_date || request?.request_snapshot?.travel_start_date || "TBD",
    travelEnd: intake?.travel_end_date || request?.request_snapshot?.travel_end_date || "TBD",
    matchedProviderId: quoteRequested[0] || shortlisted[0],
    partnerAssistanceMode,
    requestedPartnerServices: requestedServices,
    partnerShareConsent: Boolean(request?.consent_to_share_with_partners || riskFlags.partner_share_consent),
    assignedPartnerId: assignment?.partner_id,
    partnerShortlistedProviderIds: shortlisted,
    quoteRequestedProviderIds: quoteRequested,
    firstResponseMinutes: 0,
    nextAction: "",
    nextActionAt: caseRow?.updated_at || request?.created_at || new Date().toISOString(),
    riskFlags: request?.consent_to_share_with_partners === false ? ["partner consent needed"] : [],
    currency,
  };

  row.nextAction = nextActionFor(row);
  return row;
}

function normalizePartner(row) {
  const seededProfiles = {
    "Tokyo Care Bridge": {
      languages: ["ja", "en", "ko"],
      markets: ["japan"],
      services: ["medical_agency", "personal_agent", "interpreter"],
      slaHours: 4,
      verificationStatus: "verified",
    },
    "Taipei Wellness Travel": {
      languages: ["zh", "en", "ko"],
      markets: ["taiwan"],
      services: ["travel_agency", "airport_pickup", "hotel_recovery"],
      slaHours: 6,
      verificationStatus: "verified",
    },
    "Seoul Med Interpreter Pool": {
      languages: ["ja", "zh", "en", "ko"],
      markets: ["japan", "taiwan"],
      services: ["interpreter", "concierge"],
      slaHours: 8,
      verificationStatus: "pending",
    },
  };
  const profile = seededProfiles[row.name] || {};
  return {
    id: row.id,
    name: row.name,
    type: row.partner_type || "agency",
    verificationStatus: profile.verificationStatus || row.verification_status || "pending",
    languages: profile.languages || row.languages || ["en", "ko"],
    markets: profile.markets || row.markets || ["global"],
    services: profile.services || row.services || [],
    preferredProviderIds: row.preferred_provider_ids || [],
    active: Boolean(row.active),
    slaHours: profile.slaHours || row.sla_hours || 8,
  };
}

function normalizeProvider(row) {
  const profile = row.operating_profile || {};
  const standardSlaHours = Number(profile.standard_sla_hours || Math.max(1, Math.ceil((row.average_response_minutes || 360) / 60)));
  return {
    id: row.id,
    name: displayName(row.name_display, row.name_legal),
    region: row.district || row.city || "Seoul",
    specialty: row.facility_type || "clinic",
    registrationVerified: Boolean(row.medical_korea_registered),
    insuranceVerified: profile.data_source_status === "verified_docs" || profile.data_source_status === "contracted",
    languages: profile.supported_languages || row.languages || ["en", "ko"],
    slaHours: standardSlaHours,
    urgentSlaHours: Number(profile.urgent_sla_hours || Math.min(6, standardSlaHours)),
    quoteTemplateReady: Boolean(profile.quote_template_ready),
    depositPolicyReady: Boolean(profile.deposit_policy_ready),
    slaStatus: profile.sla_contract_status || "draft",
    active: Boolean(row.active),
    betaScore: Number(row.quality_score || 80),
    owner: "Ops",
    nextStep: profile.next_step || "Request quote",
    matchedCases: 0,
    quotesSent: 0,
    depositsPaid: 0,
    slaBreaches: 0,
    complaints: 0,
    platformRevenueUsd: 0,
  };
}

function normalizeQuote(row) {
  return {
    id: row.id,
    quoteRequestId: row.quote_request_id,
    caseId: row.case_id,
    providerId: row.provider_id,
    medicalFeeUsd: Number(row.medical_fee || 0),
    nonmedicalFeeUsd: Number(row.nonmedical_fee || 0),
    commissionRate: Number(row.commission_rate || 0),
    capRate: Number(row.commission_cap_rate || 0),
    depositAmountUsd: Number(row.deposit_amount || 0),
    currency: row.currency || "USD",
    validUntil: row.valid_until,
    status: row.status,
    sentAt: row.sent_at,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function normalizeAvailabilitySlot(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    doctorId: row.doctor_id || null,
    procedureId: row.procedure_id || null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    languageSupport: row.language_support || [],
    holdExpiresAt: row.hold_expires_at || null,
    holdCaseId: row.hold_case_id || null,
    holdQuoteId: row.hold_quote_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeBooking(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    quoteId: row.quote_id,
    providerId: row.provider_id,
    scheduledAt: row.scheduled_at,
    visitType: row.visit_type,
    status: row.status,
    confirmedAt: row.confirmed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeProviderQuoteRequest({ quoteRequest, caseRow, lead, intake, provider, quote }) {
  return {
    id: quoteRequest.id,
    caseId: quoteRequest.case_id,
    providerId: quoteRequest.provider_id,
    providerName: provider ? displayName(provider.name_display, provider.name_legal) : "Provider",
    patientAlias: lead?.name || `Case ${quoteRequest.case_id.slice(0, 8)}`,
    procedure: lead?.treatment_interest || lead?.attribution?.package_interest || "Consultation request",
    market: marketFromLead(lead),
    language: lead?.preferred_language || "en",
    budgetMinUsd: Number(lead?.budget_min || intake?.budget_min || 0),
    budgetMaxUsd: Number(lead?.budget_max || intake?.budget_max || 0),
    travelStart: intake?.travel_start_date || "TBD",
    travelEnd: intake?.travel_end_date || "TBD",
    status: quoteRequest.status,
    dueAt: quoteRequest.due_at,
    requestedAt: quoteRequest.requested_at,
    notes: quoteRequest.notes || "",
    caseStatus: normalizeStatus(caseRow?.status),
    quote: quote ? normalizeQuote(quote) : null,
  };
}

function normalizeActivity(row) {
  return {
    id: row.id,
    caseId: row.case_id,
    actorRole: row.actor_role,
    actorLabel: row.actor_label,
    eventType: row.event_type,
    eventPayload: row.event_payload || {},
    createdAt: row.created_at,
  };
}

function normalizeLandingRoute(row) {
  return {
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    market: row.market,
    intent: row.intent || "",
    title: row.title || "",
    subtitle: row.subtitle || "",
    searchTheme: row.search_theme || "",
    cta: row.cta || "",
    secondaryCta: row.secondary_cta || "",
    packageIds: row.package_ids || [],
    status: row.status || "draft",
    source: row.source || "admin",
    active: Boolean(row.active),
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at,
  };
}

function normalizeContactChannel(row) {
  return {
    channel: row.channel,
    label: row.label,
    href: row.href,
    officialAccountId: row.official_account_id || null,
    officialVerified: Boolean(row.official_verified),
    active: Boolean(row.active),
    displayOrder: Number(row.display_order || 0),
    notes: row.notes || null,
  };
}

function normalizeProviderOperatingProfile(row) {
  return {
    providerId: row.provider_id,
    publicExposureStatus: row.public_exposure_status,
    dataSourceStatus: row.data_source_status,
    supportedMarkets: row.supported_markets || [],
    supportedLanguages: row.supported_languages || [],
    standardSlaHours: Number(row.standard_sla_hours || 24),
    urgentSlaHours: Number(row.urgent_sla_hours || 6),
    priceRangeUsdMin: row.price_range_usd_min === null ? null : Number(row.price_range_usd_min),
    priceRangeUsdMax: row.price_range_usd_max === null ? null : Number(row.price_range_usd_max),
    quoteTemplateReady: Boolean(row.quote_template_ready),
    depositPolicyReady: Boolean(row.deposit_policy_ready),
    slaContractStatus: row.sla_contract_status,
    verificationSummary: row.verification_summary || null,
    sourceNotes: row.source_notes || null,
    lastVerifiedAt: row.last_verified_at || null,
    nextStep: row.next_step || null,
  };
}

async function getAdminOperationsData(config) {
  if (config.role !== "admin") {
    return { landingRoutes: [], contactChannels: [], providerOperatingProfiles: [] };
  }

  const [landingRoutes, contactChannels, providerOperatingProfiles] = await Promise.all([
    safeList(
      config,
      "admin_landing_routes",
      "select=id,locale,slug,market,intent,title,subtitle,search_theme,cta,secondary_cta,package_ids,status,source,active,published_at,updated_at&active=eq.true&order=updated_at.desc&limit=120",
    ),
    safeList(
      config,
      "contact_channel_settings",
      "select=channel,label,href,official_account_id,official_verified,active,display_order,notes&order=display_order.asc",
    ),
    safeList(
      config,
      "provider_operating_profiles",
      "select=provider_id,public_exposure_status,data_source_status,supported_markets,supported_languages,standard_sla_hours,urgent_sla_hours,price_range_usd_min,price_range_usd_max,quote_template_ready,deposit_policy_ready,sla_contract_status,verification_summary,source_notes,last_verified_at,next_step&order=updated_at.desc&limit=120",
    ),
  ]);

  return {
    landingRoutes: landingRoutes.map(normalizeLandingRoute),
    contactChannels: contactChannels.map(normalizeContactChannel),
    providerOperatingProfiles: providerOperatingProfiles.map(normalizeProviderOperatingProfile),
  };
}

function notificationDispatchConfigured() {
  return Boolean(process.env.NOTIFICATION_WEBHOOK_URL || process.env.RESEND_API_KEY || process.env.KAKAO_API_KEY || process.env.WHATSAPP_TOKEN);
}

function paymentMode() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "not_configured";
}

function scopeSnapshot(config, snapshot) {
  let { cases, partners, providers, providerQuoteRequests, quotes, availabilitySlots = [], bookings = [], activities } = snapshot;

  if (config.role === "partner" && config.partnerId) {
    partners = partners.filter((row) => row.id === config.partnerId);
    cases = cases.filter((row) => row.assignedPartnerId === config.partnerId);
    const caseIds = new Set(cases.map((row) => row.id));
    providerQuoteRequests = providerQuoteRequests.filter((row) => caseIds.has(row.caseId));
    quotes = quotes.filter((row) => caseIds.has(row.caseId));
    bookings = bookings.filter((row) => caseIds.has(row.caseId));
    const providerIds = new Set(bookings.map((row) => row.providerId));
    availabilitySlots = availabilitySlots.filter((row) => providerIds.has(row.providerId));
    activities = activities.filter((row) => caseIds.has(row.caseId));
  }

  if (config.role === "provider" && config.providerId) {
    providers = providers.filter((row) => row.id === config.providerId);
    providerQuoteRequests = providerQuoteRequests.filter((row) => row.providerId === config.providerId);
    const caseIds = new Set(providerQuoteRequests.map((row) => row.caseId));
    cases = cases.filter((row) => caseIds.has(row.id));
    quotes = quotes.filter((row) => row.providerId === config.providerId);
    availabilitySlots = availabilitySlots.filter((row) => row.providerId === config.providerId);
    bookings = bookings.filter((row) => row.providerId === config.providerId);
    activities = activities.filter((row) => caseIds.has(row.caseId));
    partners = [];
  }

  return { cases, partners, providers, providerQuoteRequests, quotes, availabilitySlots, bookings, activities };
}

async function getSnapshot(config) {
  const requests = await list(
    config,
    "partner_service_requests",
    "select=id,lead_id,case_id,assistance_mode,requested_services,patient_notes,consent_to_share_with_partners,status,request_snapshot,created_at,updated_at&order=created_at.desc&limit=80",
  );

  const caseIds = Array.from(new Set(requests.map((row) => row.case_id).filter(Boolean)));
  const leadIds = Array.from(new Set(requests.map((row) => row.lead_id).filter(Boolean)));
  const reservationWindowStart = encodeURIComponent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const reservationWindowEnd = encodeURIComponent(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

  const [
    cases,
    leads,
    intakes,
    assignments,
    shortlists,
    quoteRequests,
    quotes,
    activities,
    partnersRaw,
    providersRaw,
    relationships,
    providerOperatingProfilesRaw,
    availabilitySlotsRaw,
    bookingsRaw,
  ] = await Promise.all([
    caseIds.length ? list(config, "cases", `select=id,lead_id,patient_id,status,priority,source,created_at,updated_at&id=${inFilter(caseIds)}`) : [],
    leadIds.length ? list(config, "leads", `select=id,name,nationality,residence_country,preferred_language,treatment_interest,budget_min,budget_max,currency,source,attribution,created_at,updated_at&id=${inFilter(leadIds)}`) : [],
    caseIds.length ? list(config, "medical_intakes", `select=case_id,budget_min,budget_max,currency,travel_start_date,travel_end_date,risk_flags,chief_request,submitted_at&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "case_partner_assignments", `select=case_id,partner_id,assignment_role,status,assigned_at&status=in.(assigned,accepted)&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "partner_provider_shortlists", `select=case_id,partner_id,provider_id,selection_status,rank,quote_request_ready,created_at&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "quote_requests", `select=id,case_id,provider_id,status,due_at,notes,requested_at&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length
      ? list(
          config,
          "quotes",
          `select=id,quote_request_id,case_id,provider_id,medical_fee,nonmedical_fee,currency,commission_rate,commission_cap_rate,deposit_amount,valid_until,status,notes,sent_at,created_at,updated_at&case_id=${inFilter(caseIds)}&order=created_at.desc`,
        )
      : [],
    caseIds.length
      ? safeList(
          config,
          "case_activity_events",
          `select=id,case_id,actor_role,actor_label,event_type,event_payload,created_at&case_id=${inFilter(caseIds)}&order=created_at.desc&limit=120`,
        )
      : [],
    list(config, "partners", "select=id,name,partner_type,active&active=eq.true&order=name.asc"),
    list(config, "providers", "select=id,name_legal,name_display,facility_type,city,district,medical_korea_registered,active,average_response_minutes,quality_score&active=eq.true&order=quality_score.desc"),
    list(config, "partner_provider_relationships", "select=partner_id,provider_id,relationship_status,allowed_services,active&active=eq.true"),
    safeList(
      config,
      "provider_operating_profiles",
      "select=provider_id,public_exposure_status,data_source_status,supported_markets,supported_languages,standard_sla_hours,urgent_sla_hours,quote_template_ready,deposit_policy_ready,sla_contract_status,next_step",
    ),
    safeList(
      config,
      "availability_slots",
      `select=*&starts_at=gte.${reservationWindowStart}&starts_at=lt.${reservationWindowEnd}&order=starts_at.asc&limit=240`,
    ),
    safeList(
      config,
      "bookings",
      `select=*&scheduled_at=gte.${reservationWindowStart}&scheduled_at=lt.${reservationWindowEnd}&order=scheduled_at.asc&limit=240`,
    ),
  ]);

  const caseMap = new Map(cases.map((row) => [row.id, row]));
  const leadMap = new Map(leads.map((row) => [row.id, row]));
  const intakeMap = new Map(intakes.map((row) => [row.case_id, row]));
  const assignmentMap = new Map(assignments.map((row) => [row.case_id, row]));
  const providerMap = new Map(providersRaw.map((row) => [row.id, row]));
  const operatingProfileMap = new Map(providerOperatingProfilesRaw.map((row) => [row.provider_id, row]));
  const quoteByRequest = new Map();
  const quotesByCase = new Map();
  const shortlistsByCase = new Map();
  const quoteRequestsByCase = new Map();

  for (const row of quotes) {
    if (row.quote_request_id && !quoteByRequest.has(row.quote_request_id)) quoteByRequest.set(row.quote_request_id, row);
    const listRows = quotesByCase.get(row.case_id) || [];
    listRows.push(row);
    quotesByCase.set(row.case_id, listRows);
  }

  for (const row of shortlists) {
    const listRows = shortlistsByCase.get(row.case_id) || [];
    listRows.push(row);
    shortlistsByCase.set(row.case_id, listRows);
  }

  for (const row of quoteRequests) {
    const listRows = quoteRequestsByCase.get(row.case_id) || [];
    listRows.push(row);
    quoteRequestsByCase.set(row.case_id, listRows);
  }

  const relationshipsByPartner = new Map();
  for (const row of relationships) {
    const providerIds = relationshipsByPartner.get(row.partner_id) || [];
    if (row.relationship_status !== "blocked") providerIds.push(row.provider_id);
    relationshipsByPartner.set(row.partner_id, providerIds);
  }

  const casesNormalized = requests
    .map((request) =>
      normalizeCase({
        request,
        caseRow: caseMap.get(request.case_id),
        lead: leadMap.get(request.lead_id),
        intake: intakeMap.get(request.case_id),
        assignment: assignmentMap.get(request.case_id),
        shortlists: shortlistsByCase.get(request.case_id) || [],
        quoteRequests: quoteRequestsByCase.get(request.case_id) || [],
      }),
    )
    .filter((row) => row.id);

  const partners = partnersRaw.map((row) => normalizePartner({ ...row, preferred_provider_ids: relationshipsByPartner.get(row.id) || [] }));
  const providers = providersRaw.map((row) => normalizeProvider({ ...row, operating_profile: operatingProfileMap.get(row.id) }));
  const providerQuoteRequests = quoteRequests.map((quoteRequest) =>
    normalizeProviderQuoteRequest({
      quoteRequest,
      caseRow: caseMap.get(quoteRequest.case_id),
      lead: leadMap.get(caseMap.get(quoteRequest.case_id)?.lead_id),
      intake: intakeMap.get(quoteRequest.case_id),
      provider: providerMap.get(quoteRequest.provider_id),
      quote: quoteByRequest.get(quoteRequest.id),
    }),
  );

  const scoped = scopeSnapshot(config, {
    cases: casesNormalized,
    partners,
    providers,
    providerQuoteRequests,
    quotes: quotes.map(normalizeQuote),
    availabilitySlots: availabilitySlotsRaw.map(normalizeAvailabilitySlot),
    bookings: bookingsRaw.map(normalizeBooking),
    activities: activities.map(normalizeActivity),
  });
  const [leadStorageHealth, adminPersistenceHealth, adminOperationsData] = await Promise.all([
    getLeadStorageHealth(config),
    config.role === "admin" ? getAdminPersistenceHealth(config) : Promise.resolve(null),
    getAdminOperationsData(config),
  ]);

  return {
    ...scoped,
    ...adminOperationsData,
    meta: {
      mode: "supabase",
      role: config.role,
      scopedAccountId: config.scopedAccountId,
      scopedAccountEnabled: Boolean(config.scopedAccountId),
      authMethod: config.authMethod || "email",
      authEmail: config.authEmail || null,
      emailAccessConfigured: config.authMethod === "email",
      roleTokensConfigured: {
        admin: Boolean(config.roleTokens.adminToken),
        partner: Boolean(config.roleTokens.partnerToken || config.roleTokens.partnerMap.size),
        provider: Boolean(config.roleTokens.providerToken || config.roleTokens.providerMap.size),
        partnerScoped: config.roleTokens.partnerMap.size > 0,
        providerScoped: config.roleTokens.providerMap.size > 0,
      },
      notificationDispatchConfigured: notificationDispatchConfigured(),
      notificationOutboxConfigured: true,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      paymentMode: paymentMode(),
      leadStorageHealth,
      adminPersistenceHealth,
      partnerRequestCount: scoped.cases.length,
      quoteRequestCount: scoped.providerQuoteRequests.length,
      quoteResponseCount: scoped.quotes.length,
      generatedAt: new Date().toISOString(),
      hasDbPartners: scoped.partners.length > 0,
      hasDbProviders: scoped.providers.length > 0,
    },
  };
}

const LANDING_ROUTE_LOCALES = new Set(["en", "jp"]);
const LANDING_ROUTE_MARKETS = new Set(["japan", "taiwan"]);
const LANDING_ROUTE_STATUSES = new Set(["draft", "published", "paused", "archived"]);

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanPackageIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => sanitizeText(item).slice(0, 80)).filter(Boolean)));
}

async function upsertLandingRoute(config, body) {
  const route = body.route || body;
  const locale = sanitizeText(route.locale, "en").toLowerCase();
  const market = sanitizeText(route.market, "japan").toLowerCase();
  const status = sanitizeText(route.status, "draft").toLowerCase();
  const slug = normalizeSlug(route.slug);
  const title = sanitizeText(route.title);
  const intent = sanitizeText(route.intent);

  if (!LANDING_ROUTE_LOCALES.has(locale)) throw new HttpError(400, "Unsupported landing route locale.");
  if (!LANDING_ROUTE_MARKETS.has(market)) throw new HttpError(400, "Unsupported landing route market.");
  if (!LANDING_ROUTE_STATUSES.has(status)) throw new HttpError(400, "Unsupported landing route status.");
  if (!slug || !title || !intent) throw new HttpError(400, "slug, title, and intent are required.");

  await supabaseFetch(config, "admin_landing_routes?on_conflict=locale,slug", {
    method: "POST",
    body: JSON.stringify({
      locale,
      slug,
      market,
      intent,
      title,
      subtitle: sanitizeText(route.subtitle),
      search_theme: sanitizeText(route.searchTheme || route.search_theme),
      cta: sanitizeText(route.cta),
      secondary_cta: sanitizeText(route.secondaryCta || route.secondary_cta),
      package_ids: cleanPackageIds(route.packageIds || route.package_ids),
      status,
      source: "admin",
      active: route.active !== false,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }),
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function assignPartner(config, body) {
  const { caseId, partnerId } = body;
  if (!isUuid(caseId)) throw new Error("A valid caseId is required.");

  await supabaseFetch(config, `case_partner_assignments?case_id=eq.${caseId}&status=in.(assigned,accepted)`, {
    method: "PATCH",
    body: JSON.stringify({ status: "removed", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  if (partnerId) {
    if (!isUuid(partnerId)) throw new Error("A valid partnerId is required.");
    await supabaseFetch(config, "case_partner_assignments?on_conflict=case_id,partner_id,assignment_role", {
      method: "POST",
      body: JSON.stringify({
        case_id: caseId,
        partner_id: partnerId,
        assignment_role: "primary_agency",
        status: "assigned",
        consent_scope: { partner_safe_summary: true },
      }),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  await supabaseFetch(config, `partner_service_requests?case_id=eq.${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: partnerId ? "assigned" : "reviewing", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  await logActivity(config, {
    caseId,
    eventType: partnerId ? "partner_assigned" : "partner_removed",
    eventPayload: { partner_id: partnerId || null },
  });
}

async function advanceCaseStatus(config, body) {
  const { caseId, status } = body;
  if (!isUuid(caseId)) throw new Error("A valid caseId is required.");
  if (!CASE_STATUSES.has(status)) throw new Error("A valid case status is required.");

  const existing = await list(config, "cases", `select=id,status&id=eq.${caseId}&limit=1`);
  const currentCase = existing[0];
  if (!currentCase) throw new Error("Case not found.");

  if (currentCase.status !== status) {
    await supabaseFetch(config, `cases?id=eq.${caseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      prefer: "return=minimal",
    });

    await logActivity(config, {
      caseId,
      eventType: "case_status_changed",
      eventPayload: { from_status: currentCase.status, to_status: status },
    });
  }
}

async function setShortlist(config, body) {
  const { caseId, partnerId, providerIds = [] } = body;
  if (!isUuid(caseId) || !isUuid(partnerId)) throw new Error("Valid caseId and partnerId are required.");
  if (config.role === "partner" && config.partnerId && partnerId !== config.partnerId) {
    throw new HttpError(403, "This partner account can only update its own cases.");
  }

  const cleanProviderIds = providerIds.filter(isUuid);
  if (cleanProviderIds.length !== providerIds.length) throw new Error("Every providerId must be a valid UUID.");

  const existing = await list(
    config,
    "partner_provider_shortlists",
    `select=id,provider_id&case_id=eq.${caseId}&partner_id=eq.${partnerId}`,
  );

  const selected = new Set(cleanProviderIds);
  await Promise.all(
    existing
      .filter((row) => !selected.has(row.provider_id))
      .map((row) =>
        supabaseFetch(config, `partner_provider_shortlists?id=eq.${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ selection_status: "excluded", quote_request_ready: false, updated_at: new Date().toISOString() }),
          prefer: "return=minimal",
        }),
      ),
  );

  if (cleanProviderIds.length) {
    await supabaseFetch(config, "partner_provider_shortlists?on_conflict=case_id,partner_id,provider_id", {
      method: "POST",
      body: JSON.stringify(
        cleanProviderIds.map((providerId, index) => ({
          case_id: caseId,
          partner_id: partnerId,
          provider_id: providerId,
          rank: index + 1,
          selection_status: "shortlisted",
          quote_request_ready: false,
        })),
      ),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }

  await logActivity(config, {
    caseId,
    actorRole: "partner",
    actorLabel: "Partner operator",
    eventType: "partner_shortlist_updated",
    eventPayload: { partner_id: partnerId, provider_ids: cleanProviderIds },
  });
}

async function requestQuotes(config, body) {
  const { caseId, partnerId, providerIds = [] } = body;
  if (!isUuid(caseId) || !isUuid(partnerId)) throw new Error("Valid caseId and partnerId are required.");
  const cleanProviderIds = providerIds.filter(isUuid);
  if (!cleanProviderIds.length) throw new Error("At least one providerId is required.");
  if (cleanProviderIds.length !== providerIds.length) throw new Error("Every providerId must be a valid UUID.");

  await setShortlist(config, { caseId, partnerId, providerIds: cleanProviderIds });

  await supabaseFetch(config, `partner_provider_shortlists?case_id=eq.${caseId}&partner_id=eq.${partnerId}&provider_id=${inFilter(cleanProviderIds)}`, {
    method: "PATCH",
    body: JSON.stringify({ selection_status: "quote_requested", quote_request_ready: true, updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  const existing = await list(config, "quote_requests", `select=provider_id&case_id=eq.${caseId}&provider_id=${inFilter(cleanProviderIds)}`);
  const existingProviders = new Set(existing.map((row) => row.provider_id));
  const toInsert = cleanProviderIds.filter((providerId) => !existingProviders.has(providerId));

  if (toInsert.length) {
    await supabaseFetch(config, "quote_requests", {
      method: "POST",
      body: JSON.stringify(
        toInsert.map((providerId) => ({
          case_id: caseId,
          provider_id: providerId,
          status: "requested",
          due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: "Requested from partner-assisted shortlist.",
        })),
      ),
      prefer: "return=minimal",
    });
  }

  await supabaseFetch(config, `cases?id=eq.${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "quote_requested", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  await logActivity(config, {
    caseId,
    eventType: "quote_requested",
    eventPayload: { partner_id: partnerId, provider_ids: cleanProviderIds },
  });
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function submitProviderQuote(config, body) {
  const {
    quoteRequestId,
    caseId,
    providerId,
    medicalFee,
    nonmedicalFee = 0,
    currency = "USD",
    commissionRate = 0.15,
    depositAmount = 0,
    validUntil,
    notes,
  } = body;

  if (!isUuid(quoteRequestId) || !isUuid(caseId) || !isUuid(providerId)) {
    throw new Error("Valid quoteRequestId, caseId, and providerId are required.");
  }
  if (config.role === "provider" && config.providerId && providerId !== config.providerId) {
    throw new HttpError(403, "This provider account can only submit its own quotes.");
  }

  const providerRows = await list(config, "providers", `select=id,default_commission_cap_rate&id=eq.${providerId}&limit=1`);
  const provider = providerRows[0];
  if (!provider) throw new Error("Provider not found.");

  const medical = numberOrDefault(medicalFee, -1);
  const nonmedical = numberOrDefault(nonmedicalFee, 0);
  const commission = numberOrDefault(commissionRate, 0.15);
  const deposit = numberOrDefault(depositAmount, 0);
  const capRate = Number(provider.default_commission_cap_rate || 0.3);

  if (medical < 0 || nonmedical < 0 || deposit < 0) throw new Error("Fees and deposit must be zero or greater.");
  if (deposit > medical + nonmedical) throw new Error("Deposit cannot exceed the total quote amount.");
  if (commission < 0 || commission > capRate) throw new Error("Commission rate exceeds the provider cap.");

  const quoteRows = await supabaseFetch(config, "quotes", {
    method: "POST",
    body: JSON.stringify({
      quote_request_id: quoteRequestId,
      case_id: caseId,
      provider_id: providerId,
      medical_fee: medical,
      nonmedical_fee: nonmedical,
      currency: String(currency).slice(0, 3).toUpperCase(),
      commission_rate: commission,
      commission_cap_rate: capRate,
      deposit_amount: deposit,
      valid_until: validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: "sent",
      notes: notes || "Provider quote submitted through Phase 2 quote desk.",
      sent_at: new Date().toISOString(),
    }),
    prefer: "return=representation",
  });

  const quote = Array.isArray(quoteRows) ? quoteRows[0] : null;

  await supabaseFetch(config, `quote_requests?id=eq.${quoteRequestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "responded", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  await supabaseFetch(config, `cases?id=eq.${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "quote_sent", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  if (quote?.id) {
    await supabaseFetch(config, "commission_checks", {
      method: "POST",
      body: JSON.stringify({
        quote_id: quote.id,
        case_id: caseId,
        provider_id: providerId,
        requested_rate: commission,
        cap_rate: capRate,
        passed: true,
      }),
      prefer: "return=minimal",
    });
  }

  await logActivity(config, {
    caseId,
    actorRole: "provider",
    actorLabel: "Provider quote desk",
    eventType: "provider_quote_submitted",
    eventPayload: {
      quote_request_id: quoteRequestId,
      provider_id: providerId,
      quote_id: quote?.id,
      medical_fee: medical,
      nonmedical_fee: nonmedical,
      currency: String(currency).slice(0, 3).toUpperCase(),
    },
  });
}

function sanitizeText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 400);
}

function sanitizeTimestamp(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

async function tryStoreNotification(config, event) {
  try {
    await supabaseFetch(config, "notification_outbox", {
      method: "POST",
      body: JSON.stringify({
        id: event.id,
        case_id: event.caseId,
        quote_id: event.quoteId || null,
        booking_id: event.bookingId || null,
        channel: event.channel,
        recipient: event.recipient,
        template: event.template,
        status: event.status,
        payload: event.payload,
        dispatch_result: event.dispatchResult,
        send_after: event.sendAfter,
        delivery_key: event.deliveryKey || null,
        created_at: event.createdAt,
      }),
      prefer: "return=minimal",
      timeoutMs: ACTIVITY_LOG_TIMEOUT_MS,
    });
    return "notification_outbox";
  } catch (error) {
    try {
      await supabaseFetch(config, "notification_outbox", {
        method: "POST",
        body: JSON.stringify({
          id: event.id,
          case_id: event.caseId,
          quote_id: event.quoteId || null,
          channel: event.channel,
          recipient: event.recipient,
          template: event.template,
          status: event.status,
          payload: event.payload,
          dispatch_result: event.dispatchResult,
          created_at: event.createdAt,
        }),
        prefer: "return=minimal",
        timeoutMs: ACTIVITY_LOG_TIMEOUT_MS,
      });
      return "notification_outbox";
    } catch (fallbackError) {
      console.warn("Optional notification outbox insert skipped.", fallbackError);
      return "case_activity_events";
    }
  }
}

async function dispatchNotification(event) {
  if (Date.parse(event.sendAfter) > Date.now()) {
    return { status: "queued", result: { gateway: "scheduled", send_after: event.sendAfter } };
  }

  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return { status: "queued", result: { gateway: "not_configured" } };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const text = await response.text();
    if (!response.ok) {
      return { status: "failed", result: { gateway: "webhook", status: response.status, message: text.slice(0, 300) } };
    }
    return { status: "sent", result: { gateway: "webhook", status: response.status, response: text.slice(0, 300) } };
  } catch (error) {
    return { status: "failed", result: { gateway: "webhook", message: error instanceof Error ? error.message : "Webhook dispatch failed." } };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function queueNotification(config, body) {
  const caseId = sanitizeText(body.caseId);
  if (!caseId) throw new HttpError(400, "caseId is required.");

  const event = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    caseId,
    quoteId: sanitizeText(body.quoteId),
    bookingId: sanitizeText(body.bookingId),
    channel: sanitizeText(body.channel, "email"),
    recipient: sanitizeText(body.recipient, "case_contact"),
    template: sanitizeText(body.template, "quote_ready"),
    sendAfter: sanitizeTimestamp(body.sendAfter) || new Date().toISOString(),
    deliveryKey: sanitizeText(body.deliveryKey),
    status: "queued",
    payload: body.payload && typeof body.payload === "object" ? body.payload : {},
    dispatchResult: {},
    createdAt: new Date().toISOString(),
  };

  const dispatch = await dispatchNotification(event);
  event.status = dispatch.status;
  event.dispatchResult = dispatch.result;
  const storage = await tryStoreNotification(config, event);

  await logActivity(config, {
    caseId,
    actorRole: config.role,
    actorLabel: "Operations notification",
    eventType: dispatch.status === "sent" ? "notification_sent" : "notification_queued",
    eventPayload: {
      notification_id: event.id,
      quote_id: event.quoteId || null,
      channel: event.channel,
      template: event.template,
      status: event.status,
      storage,
    },
  });

  return { ok: true, notificationId: event.id, status: event.status, storage, dispatchResult: event.dispatchResult };
}

function appBaseUrl(req) {
  const configured = process.env.APP_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) {
    return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
  }

  const proto = getHeader(req, "x-forwarded-proto") || "https";
  const host = getHeader(req, "x-forwarded-host") || getHeader(req, "host");
  return `${proto}://${host}`;
}

async function createDepositCheckout(config, req, body) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) throw new HttpError(503, "STRIPE_SECRET_KEY is not configured.");

  const caseId = sanitizeText(body.caseId);
  const quoteId = sanitizeText(body.quoteId);
  const providerId = sanitizeText(body.providerId);
  const depositAmountUsd = numberOrDefault(body.depositAmountUsd ?? body.depositAmount, -1);
  const unitAmount = Math.round(depositAmountUsd * 100);

  if (!caseId || !quoteId) throw new HttpError(400, "caseId and quoteId are required.");
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) throw new HttpError(400, "A valid deposit amount is required.");

  const baseUrl = appBaseUrl(req);
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("client_reference_id", quoteId);
  params.append("success_url", `${baseUrl}/admin/quote-booking?deposit=success&session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${baseUrl}/admin/quote-booking?deposit=cancelled`);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.append("line_items[0][price_data][product_data][name]", `GCL deposit ${quoteId}`);
  params.append("line_items[0][price_data][product_data][description]", "Patient deposit for provider quote and booking coordination.");
  params.append("metadata[case_id]", caseId);
  params.append("metadata[quote_id]", quoteId);
  if (providerId) params.append("metadata[provider_id]", providerId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new HttpError(response.status, payload?.error?.message || "Stripe Checkout session could not be created.");
  }

  await logActivity(config, {
    caseId,
    actorRole: config.role,
    actorLabel: "Stripe checkout",
    eventType: "deposit_checkout_created",
    eventPayload: {
      quote_id: quoteId,
      provider_id: providerId || null,
      session_id: payload.id,
      deposit_amount_usd: depositAmountUsd,
      payment_mode: paymentMode(),
    },
  });

  return { ok: true, checkoutUrl: payload.url, sessionId: payload.id, paymentMode: paymentMode() };
}

const SLOT_STATUSES = new Set(["available", "held", "booked", "unavailable"]);
const VISIT_TYPES = new Set(["consultation", "procedure", "surgery", "checkup"]);

function cleanLanguageSupport(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => sanitizeText(item).toLowerCase()).filter(Boolean))).slice(0, 8);
}

function assertProviderAccess(config, providerId) {
  if (config.role === "provider" && config.providerId && providerId !== config.providerId) {
    throw new HttpError(403, "This provider account can only manage its own slots.");
  }
}

async function readAvailabilitySlot(config, slotId) {
  if (!isUuid(slotId)) throw new HttpError(400, "A valid slotId is required.");
  const rows = await list(config, "availability_slots", `select=*&id=eq.${slotId}&limit=1`);
  const slot = rows[0];
  if (!slot) throw new HttpError(404, "Availability slot not found.");
  assertProviderAccess(config, slot.provider_id);
  return slot;
}

async function patchAvailabilitySlot(config, slotId, patch) {
  try {
    const rows = await supabaseFetch(config, `availability_slots?id=eq.${slotId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      prefer: "return=representation",
    });
    if (!rows?.[0]) throw new HttpError(409, "Availability slot could not be updated.");
    return rows[0];
  } catch (error) {
    const hasHoldColumns = "hold_case_id" in patch || "hold_quote_id" in patch;
    if (!hasHoldColumns) throw error;

    const { hold_case_id, hold_quote_id, ...compatiblePatch } = patch;
    const rows = await supabaseFetch(config, `availability_slots?id=eq.${slotId}`, {
      method: "PATCH",
      body: JSON.stringify(compatiblePatch),
      prefer: "return=representation",
    });
    if (!rows?.[0]) throw new HttpError(409, "Availability slot could not be updated.");
    return rows[0];
  }
}

async function createAvailabilitySlot(config, body) {
  const providerId = sanitizeText(body.providerId);
  const status = sanitizeText(body.status, "available").toLowerCase();
  const startsAt = sanitizeTimestamp(body.startsAt);
  const endsAt = sanitizeTimestamp(body.endsAt);

  if (!isUuid(providerId)) throw new HttpError(400, "A valid providerId is required.");
  assertProviderAccess(config, providerId);
  if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) throw new HttpError(400, "A valid slot time range is required.");
  if (!SLOT_STATUSES.has(status)) throw new HttpError(400, "A valid slot status is required.");

  const rows = await supabaseFetch(config, "availability_slots", {
    method: "POST",
    body: JSON.stringify({
      provider_id: providerId,
      starts_at: startsAt,
      ends_at: endsAt,
      status,
      language_support: cleanLanguageSupport(body.languageSupport),
    }),
    prefer: "return=representation",
  });

  return { ok: true, slot: normalizeAvailabilitySlot(rows[0]) };
}

async function holdAvailabilitySlot(config, body) {
  const slotId = sanitizeText(body.slotId);
  const caseId = sanitizeText(body.caseId);
  const quoteId = sanitizeText(body.quoteId);
  if (!isUuid(caseId)) throw new HttpError(400, "A valid caseId is required.");
  if (quoteId && !isUuid(quoteId)) throw new HttpError(400, "quoteId must be a valid UUID.");

  const slot = await readAvailabilitySlot(config, slotId);
  const nowMs = Date.now();
  const heldExpired = slot.status === "held" && slot.hold_expires_at && Date.parse(slot.hold_expires_at) <= nowMs;
  if (slot.status === "booked" || slot.status === "unavailable") throw new HttpError(409, "This slot is not available.");
  if (slot.status === "held" && !heldExpired) throw new HttpError(409, "This slot is already temporarily held.");

  const holdMinutes = Math.max(5, Math.min(120, numberOrDefault(body.holdMinutes, 15)));
  const holdExpiresAt = new Date(nowMs + holdMinutes * 60 * 1000).toISOString();
  const updated = await patchAvailabilitySlot(config, slot.id, {
    status: "held",
    hold_expires_at: holdExpiresAt,
    hold_case_id: caseId,
    hold_quote_id: quoteId || null,
    updated_at: new Date().toISOString(),
  });

  const notification = await queueNotification(config, {
    caseId,
    quoteId,
    channel: sanitizeText(body.channel, "email"),
    recipient: sanitizeText(body.recipient, "case_contact"),
    template: "slot_hold_created",
    deliveryKey: `slot:${slot.id}:hold:${caseId}`,
    payload: {
      slot_id: slot.id,
      provider_id: slot.provider_id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      hold_expires_at: holdExpiresAt,
    },
  });

  await logActivity(config, {
    caseId,
    eventType: "availability_slot_held",
    eventPayload: { slot_id: slot.id, quote_id: quoteId || null, provider_id: slot.provider_id, hold_expires_at: holdExpiresAt },
  });

  return { ok: true, slot: normalizeAvailabilitySlot(updated), notifications: [notification] };
}

async function releaseAvailabilitySlot(config, body) {
  const slot = await readAvailabilitySlot(config, sanitizeText(body.slotId));
  const caseId = sanitizeText(body.caseId) || slot.hold_case_id || "";
  const quoteId = sanitizeText(body.quoteId) || slot.hold_quote_id || "";

  if (slot.status === "booked") throw new HttpError(409, "Booked slots cannot be released from the hold flow.");

  const updated = await patchAvailabilitySlot(config, slot.id, {
    status: "available",
    hold_expires_at: null,
    hold_case_id: null,
    hold_quote_id: null,
    updated_at: new Date().toISOString(),
  });

  await logActivity(config, {
    caseId,
    eventType: "availability_slot_released",
    eventPayload: { slot_id: slot.id, quote_id: quoteId || null, provider_id: slot.provider_id },
  });

  return { ok: true, slot: normalizeAvailabilitySlot(updated), notifications: [] };
}

async function confirmHeldBooking(config, body) {
  const slot = await readAvailabilitySlot(config, sanitizeText(body.slotId));
  const caseId = sanitizeText(body.caseId);
  const quoteId = sanitizeText(body.quoteId);
  const visitType = sanitizeText(body.visitType, "procedure").toLowerCase();

  if (!isUuid(caseId) || !isUuid(quoteId)) throw new HttpError(400, "Valid caseId and quoteId are required.");
  if (!VISIT_TYPES.has(visitType)) throw new HttpError(400, "A valid visitType is required.");
  if (slot.status === "booked" || slot.status === "unavailable") throw new HttpError(409, "This slot cannot be booked.");
  if (slot.status === "held" && slot.hold_expires_at && Date.parse(slot.hold_expires_at) <= Date.now()) {
    throw new HttpError(409, "The temporary hold has expired.");
  }

  const quoteRows = await list(config, "quotes", `select=id,case_id,provider_id&id=eq.${quoteId}&limit=1`);
  const quote = quoteRows[0];
  if (!quote) throw new HttpError(404, "Quote not found.");
  if (quote.case_id !== caseId || quote.provider_id !== slot.provider_id) throw new HttpError(409, "Quote, case, and provider do not match the selected slot.");

  const bookingRows = await supabaseFetch(config, "bookings?on_conflict=idempotency_key", {
    method: "POST",
    body: JSON.stringify({
      case_id: caseId,
      quote_id: quoteId,
      provider_id: slot.provider_id,
      scheduled_at: slot.starts_at,
      visit_type: visitType,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      idempotency_key: `slot:${slot.id}:case:${caseId}:quote:${quoteId}`,
    }),
    prefer: "resolution=merge-duplicates,return=representation",
  });
  const booking = bookingRows[0];

  const updatedSlot = await patchAvailabilitySlot(config, slot.id, {
    status: "booked",
    hold_expires_at: null,
    hold_case_id: null,
    hold_quote_id: null,
    updated_at: new Date().toISOString(),
  });

  await supabaseFetch(config, `cases?id=eq.${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "booking_confirmed", updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  const notifications = [];
  notifications.push(
    await queueNotification(config, {
      caseId,
      quoteId,
      bookingId: booking.id,
      channel: sanitizeText(body.channel, "email"),
      recipient: sanitizeText(body.recipient, "case_contact"),
      template: "booking_confirmed_patient",
      deliveryKey: `booking:${booking.id}:confirmed:patient`,
      payload: {
        booking_id: booking.id,
        slot_id: slot.id,
        provider_id: slot.provider_id,
        scheduled_at: slot.starts_at,
        visit_type: visitType,
      },
    }),
  );
  notifications.push(
    await queueNotification(config, {
      caseId,
      quoteId,
      bookingId: booking.id,
      channel: "email",
      recipient: "provider_ops",
      template: "booking_confirmed_provider",
      deliveryKey: `booking:${booking.id}:confirmed:provider`,
      payload: {
        booking_id: booking.id,
        slot_id: slot.id,
        provider_id: slot.provider_id,
        scheduled_at: slot.starts_at,
      },
    }),
  );

  const reminderAt = new Date(Date.parse(slot.starts_at) - 24 * 60 * 60 * 1000).toISOString();
  if (Date.parse(reminderAt) > Date.now()) {
    notifications.push(
      await queueNotification(config, {
        caseId,
        quoteId,
        bookingId: booking.id,
        channel: sanitizeText(body.channel, "email"),
        recipient: sanitizeText(body.recipient, "case_contact"),
        template: "booking_reminder_24h",
        sendAfter: reminderAt,
        deliveryKey: `booking:${booking.id}:reminder:24h`,
        payload: {
          booking_id: booking.id,
          slot_id: slot.id,
          provider_id: slot.provider_id,
          scheduled_at: slot.starts_at,
          send_after: reminderAt,
        },
      }),
    );
  }

  await logActivity(config, {
    caseId,
    eventType: "booking_confirmed_from_slot",
    eventPayload: { slot_id: slot.id, booking_id: booking.id, quote_id: quoteId, provider_id: slot.provider_id },
  });

  return { ok: true, slot: normalizeAvailabilitySlot(updatedSlot), booking: normalizeBooking(booking), notifications };
}

function allowedRolesForAction(action) {
  if (action === "setShortlist") return ["admin", "partner"];
  if (action === "submitProviderQuote") return ["admin", "provider"];
  if (action === "createAvailabilitySlot") return ["admin", "provider"];
  if (
    action === "assignPartner" ||
    action === "advanceCaseStatus" ||
    action === "requestQuotes" ||
    action === "queueNotification" ||
    action === "createDepositCheckout" ||
    action === "holdAvailabilitySlot" ||
    action === "releaseAvailabilitySlot" ||
    action === "confirmHeldBooking" ||
    action === "upsertLandingRoute"
  ) {
    return ["admin"];
  }
  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const config = await requireConfig(req, ["admin", "partner", "provider"]);
      if (config.error) return json(res, config.status, { error: config.error });
      return json(res, 200, await getSnapshot(config));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const allowedRoles = allowedRolesForAction(body.action);
      if (!allowedRoles) return json(res, 400, { error: "Unsupported action." });

      const config = await requireConfig(req, allowedRoles);
      if (config.error) return json(res, config.status, { error: config.error });

      if (body.action === "assignPartner") await assignPartner(config, body);
      else if (body.action === "advanceCaseStatus") await advanceCaseStatus(config, body);
      else if (body.action === "setShortlist") await setShortlist(config, body);
      else if (body.action === "requestQuotes") await requestQuotes(config, body);
      else if (body.action === "submitProviderQuote") await submitProviderQuote(config, body);
      else if (body.action === "queueNotification") return json(res, 200, await queueNotification(config, body));
      else if (body.action === "createDepositCheckout") return json(res, 200, await createDepositCheckout(config, req, body));
      else if (body.action === "createAvailabilitySlot") return json(res, 200, await createAvailabilitySlot(config, body));
      else if (body.action === "holdAvailabilitySlot") return json(res, 200, await holdAvailabilitySlot(config, body));
      else if (body.action === "releaseAvailabilitySlot") return json(res, 200, await releaseAvailabilitySlot(config, body));
      else if (body.action === "confirmHeldBooking") return json(res, 200, await confirmHeldBooking(config, body));
      else if (body.action === "upsertLandingRoute") await upsertLandingRoute(config, body);

      return json(res, 200, await getSnapshot(config));
    }

    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, error?.status || 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
  }
}
