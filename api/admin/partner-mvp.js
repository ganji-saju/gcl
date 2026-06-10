const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

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

function requireConfig(req) {
  const token = process.env.ADMIN_API_TOKEN;
  const suppliedToken = readToken(req);

  if (!token) {
    return { error: "ADMIN_API_TOKEN is not configured.", status: 503 };
  }

  if (!suppliedToken || suppliedToken !== token) {
    return { error: "Unauthorized.", status: 401 };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Supabase server credentials are not configured.", status: 503 };
  }

  return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), serviceRoleKey };
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
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message || body?.hint || text || `Supabase request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
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
  return {
    id: row.id,
    name: displayName(row.name_display, row.name_legal),
    region: row.district || row.city || "Seoul",
    specialty: row.facility_type || "clinic",
    registrationVerified: Boolean(row.medical_korea_registered),
    insuranceVerified: true,
    languages: row.languages || ["en", "ko"],
    slaHours: Math.max(1, Math.ceil((row.average_response_minutes || 360) / 60)),
    urgentSlaHours: 4,
    quoteTemplateReady: true,
    depositPolicyReady: true,
    slaStatus: "draft",
    active: Boolean(row.active),
    betaScore: Number(row.quality_score || 80),
    owner: "Ops",
    nextStep: "Request quote",
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

async function getSnapshot(config) {
  const requests = await list(
    config,
    "partner_service_requests",
    "select=id,lead_id,case_id,assistance_mode,requested_services,patient_notes,consent_to_share_with_partners,status,request_snapshot,created_at,updated_at&order=created_at.desc&limit=80",
  );

  const caseIds = Array.from(new Set(requests.map((row) => row.case_id).filter(Boolean)));
  const leadIds = Array.from(new Set(requests.map((row) => row.lead_id).filter(Boolean)));

  const [cases, leads, intakes, assignments, shortlists, quoteRequests, quotes, activities, partnersRaw, providersRaw, relationships] = await Promise.all([
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
  ]);

  const caseMap = new Map(cases.map((row) => [row.id, row]));
  const leadMap = new Map(leads.map((row) => [row.id, row]));
  const intakeMap = new Map(intakes.map((row) => [row.case_id, row]));
  const assignmentMap = new Map(assignments.map((row) => [row.case_id, row]));
  const providerMap = new Map(providersRaw.map((row) => [row.id, row]));
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
  const providers = providersRaw.map(normalizeProvider);
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

  return {
    cases: casesNormalized,
    partners,
    providers,
    providerQuoteRequests,
    quotes: quotes.map(normalizeQuote),
    activities: activities.map(normalizeActivity),
    meta: {
      mode: "supabase",
      partnerRequestCount: requests.length,
      quoteRequestCount: quoteRequests.length,
      quoteResponseCount: quotes.length,
      generatedAt: new Date().toISOString(),
      hasDbPartners: partners.length > 0,
      hasDbProviders: providers.length > 0,
    },
  };
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

export default async function handler(req, res) {
  try {
    const config = requireConfig(req);
    if (config.error) return json(res, config.status, { error: config.error });

    if (req.method === "GET") {
      return json(res, 200, await getSnapshot(config));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      if (body.action === "assignPartner") await assignPartner(config, body);
      else if (body.action === "advanceCaseStatus") await advanceCaseStatus(config, body);
      else if (body.action === "setShortlist") await setShortlist(config, body);
      else if (body.action === "requestQuotes") await requestQuotes(config, body);
      else if (body.action === "submitProviderQuote") await submitProviderQuote(config, body);
      else return json(res, 400, { error: "Unsupported action." });

      return json(res, 200, await getSnapshot(config));
    }

    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
  }
}
