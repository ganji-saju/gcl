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

async function getSnapshot(config) {
  const requests = await list(
    config,
    "partner_service_requests",
    "select=id,lead_id,case_id,assistance_mode,requested_services,patient_notes,consent_to_share_with_partners,status,request_snapshot,created_at,updated_at&order=created_at.desc&limit=80",
  );

  const caseIds = Array.from(new Set(requests.map((row) => row.case_id).filter(Boolean)));
  const leadIds = Array.from(new Set(requests.map((row) => row.lead_id).filter(Boolean)));

  const [cases, leads, intakes, assignments, shortlists, quoteRequests, partnersRaw, providersRaw, relationships] = await Promise.all([
    caseIds.length ? list(config, "cases", `select=id,lead_id,patient_id,status,priority,source,created_at,updated_at&id=${inFilter(caseIds)}`) : [],
    leadIds.length ? list(config, "leads", `select=id,name,nationality,residence_country,preferred_language,treatment_interest,budget_min,budget_max,currency,source,attribution,created_at,updated_at&id=${inFilter(leadIds)}`) : [],
    caseIds.length ? list(config, "medical_intakes", `select=case_id,budget_min,budget_max,currency,travel_start_date,travel_end_date,risk_flags,chief_request,submitted_at&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "case_partner_assignments", `select=case_id,partner_id,assignment_role,status,assigned_at&status=in.(assigned,accepted)&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "partner_provider_shortlists", `select=case_id,partner_id,provider_id,selection_status,rank,quote_request_ready,created_at&case_id=${inFilter(caseIds)}`) : [],
    caseIds.length ? list(config, "quote_requests", `select=case_id,provider_id,status,requested_at&case_id=${inFilter(caseIds)}`) : [],
    list(config, "partners", "select=id,name,partner_type,active&active=eq.true&order=name.asc"),
    list(config, "providers", "select=id,name_legal,name_display,facility_type,city,district,medical_korea_registered,active,average_response_minutes,quality_score&active=eq.true&order=quality_score.desc"),
    list(config, "partner_provider_relationships", "select=partner_id,provider_id,relationship_status,allowed_services,active&active=eq.true"),
  ]);

  const caseMap = new Map(cases.map((row) => [row.id, row]));
  const leadMap = new Map(leads.map((row) => [row.id, row]));
  const intakeMap = new Map(intakes.map((row) => [row.case_id, row]));
  const assignmentMap = new Map(assignments.map((row) => [row.case_id, row]));
  const shortlistsByCase = new Map();
  const quoteRequestsByCase = new Map();

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

  return {
    cases: casesNormalized,
    partners,
    providers,
    meta: {
      mode: "supabase",
      partnerRequestCount: requests.length,
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
      else if (body.action === "setShortlist") await setShortlist(config, body);
      else if (body.action === "requestQuotes") await requestQuotes(config, body);
      else return json(res, 400, { error: "Unsupported action." });

      return json(res, 200, await getSnapshot(config));
    }

    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
  }
}
