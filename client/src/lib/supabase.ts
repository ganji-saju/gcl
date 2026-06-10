export interface InquiryInput {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  residenceCountry?: string;
  preferredLanguage: string;
  treatmentInterest?: string;
  packageInterest?: string;
  market?: string;
  hospitalSlug?: string;
  preferredDate?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  budget?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  message?: string;
  partnerAssistanceMode?: string;
  partnerServices?: string[];
  partnerShareConsent?: boolean;
  hasKoreanNationalHealthInsurance?: boolean;
  hasKoreanAlienRegistration?: boolean;
  hasOverseasKoreanResidenceReport?: boolean;
  sourceLanding?: string;
  consent: boolean;
  consentMarketing?: boolean;
}

export interface InquiryResult {
  saved: boolean;
  demoMode: boolean;
  storage: "v1" | "inquiries" | "local";
  caseId?: string;
  leadId?: string;
  eligible?: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_REQUEST_TIMEOUT_MS = 6000;

class SupabaseRequestError extends Error {
  timedOut: boolean;

  constructor(message: string, timedOut = false) {
    super(message);
    this.name = "SupabaseRequestError";
    this.timedOut = timedOut;
  }
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getAttribution(input: InquiryInput) {
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  return {
    ...Object.fromEntries(searchParams),
    source_landing: clean(input.sourceLanding) ?? searchParams.get("source_landing"),
    package_interest: clean(input.packageInterest),
    market: clean(input.market),
    partner_assistance_mode: clean(input.partnerAssistanceMode) ?? "platform_direct",
    partner_services: input.partnerServices ?? [],
    partner_share_consent: Boolean(input.partnerShareConsent),
    current_path: typeof window === "undefined" ? null : window.location.pathname,
  };
}

function getEligibility(input: InquiryInput) {
  const blockedByInsurance = Boolean(input.hasKoreanNationalHealthInsurance);
  const blockedByAlienRegistration = Boolean(input.hasKoreanAlienRegistration);
  const blockedByOverseasKoreanReport = Boolean(input.hasOverseasKoreanResidenceReport);
  const eligible = !blockedByInsurance && !blockedByAlienRegistration && !blockedByOverseasKoreanReport;
  const reason = blockedByInsurance
    ? "korean_health_insurance_holder"
    : blockedByAlienRegistration
      ? "korean_alien_registration_holder"
      : blockedByOverseasKoreanReport
        ? "overseas_korean_residence_report_holder"
        : "foreign_patient_eligible";

  return { eligible, reason };
}

function toRecord(input: InquiryInput) {
  const validationSummary = [
    input.packageInterest ? `Package: ${input.packageInterest}` : null,
    input.market ? `Market: ${input.market}` : null,
    input.residenceCountry ? `Residence: ${input.residenceCountry}` : null,
    input.travelStartDate || input.travelEndDate ? `Travel window: ${input.travelStartDate ?? "?"} to ${input.travelEndDate ?? "?"}` : null,
    input.budgetMin || input.budgetMax ? `Budget numeric: ${input.budgetMin ?? "?"}-${input.budgetMax ?? "?"} ${input.currency ?? "USD"}` : null,
    input.partnerAssistanceMode && input.partnerAssistanceMode !== "platform_direct" ? `Partner mode: ${input.partnerAssistanceMode}` : null,
    input.partnerServices?.length ? `Partner services: ${input.partnerServices.join(", ")}` : null,
    input.partnerShareConsent ? "Partner sharing consent: yes" : input.partnerServices?.length ? "Partner sharing consent: no" : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: clean(input.phone),
    nationality: clean(input.nationality),
    preferred_language: input.preferredLanguage,
    treatment_interest: clean(input.packageInterest) ?? clean(input.treatmentInterest),
    hospital_slug: clean(input.hospitalSlug),
    preferred_date: clean(input.preferredDate) ?? clean(input.travelStartDate),
    budget: clean(input.budget) ?? (input.budgetMin || input.budgetMax ? `${input.budgetMin ?? "?"}-${input.budgetMax ?? "?"} ${input.currency ?? "USD"}` : null),
    message: [validationSummary, clean(input.message)].filter(Boolean).join("\n\n") || null,
    consent: input.consent,
    source_path: typeof window === "undefined" ? null : window.location.pathname,
    utm: getAttribution(input),
  };
}

function saveLocalDemoInquiry(input: InquiryInput) {
  const key = "gph_demo_inquiries";
  const previous = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
  previous.unshift({
    id: crypto.randomUUID(),
    ...toRecord(input),
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(key, JSON.stringify(previous.slice(0, 50)));
}

function saveLocalFallbackInquiry(input: InquiryInput): InquiryResult {
  try {
    saveLocalDemoInquiry(input);
  } catch (error) {
    console.warn("Local consultation fallback could not be persisted.", error);
  }

  return { saved: true, demoMode: true, storage: "local", eligible: getEligibility(input).eligible };
}

function isSupabaseTimeout(error: unknown) {
  return error instanceof SupabaseRequestError && error.timedOut;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new SupabaseRequestError("Supabase request timed out.", true);
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new SupabaseRequestError("Supabase request timed out.", true);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function insertSupabaseRecord(table: string, record: Record<string, unknown>): Promise<void> {
  const response = await fetchWithTimeout(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new SupabaseRequestError(details || `Supabase ${table} insert failed with ${response.status}`);
  }
}

async function tryInsertSupabaseRecord(table: string, record: Record<string, unknown>): Promise<void> {
  try {
    await insertSupabaseRecord(table, record);
  } catch (error) {
    console.warn(`Optional Supabase ${table} insert skipped.`, error);
  }
}

async function insertInquiryFallback(input: InquiryInput): Promise<InquiryResult> {
  const response = await fetchWithTimeout(`${supabaseUrl}/rest/v1/inquiries`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(toRecord(input)),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new SupabaseRequestError(details || `Supabase request failed with ${response.status}`);
  }

  return { saved: true, demoMode: false, storage: "inquiries" };
}

async function insertV1LeadCase(input: InquiryInput): Promise<InquiryResult> {
  const eligibility = getEligibility(input);
  const attribution = getAttribution(input);
  const currency = input.currency ?? "USD";
  const patientId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const caseId = crypto.randomUUID();

  await insertSupabaseRecord("patients", {
    id: patientId,
    nationality: clean(input.nationality),
    residence_country: clean(input.residenceCountry),
    preferred_language: input.preferredLanguage,
    foreign_patient_eligible: eligibility.eligible,
    eligibility_reason: eligibility.reason,
    passport_required_later: true,
    consent_medical_info: input.consent,
    consent_marketing: Boolean(input.consentMarketing),
  });

  await insertSupabaseRecord("patient_eligibility_checks", {
    id: crypto.randomUUID(),
    patient_id: patientId,
    nationality: clean(input.nationality) ?? "unknown",
    residence_country: clean(input.residenceCountry) ?? "unknown",
    has_korean_national_health_insurance: Boolean(input.hasKoreanNationalHealthInsurance),
    has_korean_alien_registration: Boolean(input.hasKoreanAlienRegistration),
    has_overseas_korean_residence_report: Boolean(input.hasOverseasKoreanResidenceReport),
    purpose: clean(input.treatmentInterest) ?? clean(input.packageInterest) ?? "dermatology_treatment",
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    request_snapshot: {
      package_interest: clean(input.packageInterest),
      market: clean(input.market),
      source_landing: clean(input.sourceLanding),
    },
  });

  await insertSupabaseRecord("leads", {
    id: leadId,
    patient_id: patientId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: clean(input.phone),
    nationality: clean(input.nationality),
    residence_country: clean(input.residenceCountry),
    preferred_language: input.preferredLanguage,
    treatment_interest: clean(input.packageInterest) ?? clean(input.treatmentInterest),
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    currency,
    status: eligibility.eligible ? "qualified" : "disqualified",
    source: clean(input.sourceLanding) ? "landing" : "site",
    attribution,
    disqualified_reason: eligibility.eligible ? null : eligibility.reason,
    consent_medical_info: input.consent,
    consent_marketing: Boolean(input.consentMarketing),
  });

  if (!eligibility.eligible) {
    return { saved: true, demoMode: false, storage: "v1", leadId, eligible: false };
  }

  await insertSupabaseRecord("cases", {
    id: caseId,
    patient_id: patientId,
    lead_id: leadId,
    source: clean(input.sourceLanding) ? "landing" : "site",
    status: "qualified",
    priority: "normal",
  });

  await insertSupabaseRecord("medical_intakes", {
    id: crypto.randomUUID(),
    patient_id: patientId,
    case_id: caseId,
    chief_request: [clean(input.packageInterest), clean(input.message)].filter(Boolean).join("\n\n") || null,
    medical_history: {},
    medications: [],
    allergies: [],
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    currency,
    travel_start_date: clean(input.travelStartDate) ?? clean(input.preferredDate),
    travel_end_date: clean(input.travelEndDate) ?? clean(input.preferredDate),
    risk_flags: {
      market: clean(input.market),
      package_interest: clean(input.packageInterest),
      partner_assistance_mode: clean(input.partnerAssistanceMode) ?? "platform_direct",
      partner_services: input.partnerServices ?? [],
      partner_share_consent: Boolean(input.partnerShareConsent),
      source_landing: clean(input.sourceLanding),
    },
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });

  const requestedServices = input.partnerServices?.filter(Boolean) ?? [];
  const partnerMode = clean(input.partnerAssistanceMode) ?? "platform_direct";
  const hasPartnerRequest = partnerMode !== "platform_direct" || requestedServices.length > 0;

  if (hasPartnerRequest) {
    await tryInsertSupabaseRecord("partner_service_requests", {
      id: crypto.randomUUID(),
      lead_id: leadId,
      case_id: caseId,
      assistance_mode: partnerMode,
      requested_services: requestedServices,
      patient_notes: clean(input.message),
      consent_to_share_with_partners: Boolean(input.partnerShareConsent),
      status: "requested",
      request_snapshot: {
        market: clean(input.market),
        package_interest: clean(input.packageInterest),
        treatment_interest: clean(input.treatmentInterest),
        travel_start_date: clean(input.travelStartDate),
        travel_end_date: clean(input.travelEndDate),
        residence_country: clean(input.residenceCountry),
        preferred_language: input.preferredLanguage,
      },
    });
  }

  return { saved: true, demoMode: false, storage: "v1", leadId, caseId, eligible: true };
}

export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  if (!isSupabaseConfigured()) {
    return saveLocalFallbackInquiry(input);
  }

  try {
    return await insertV1LeadCase(input);
  } catch (error) {
    console.warn("Falling back to inquiries table because v1 lead storage failed.", error);
    if (isSupabaseTimeout(error)) {
      return saveLocalFallbackInquiry(input);
    }

    try {
      return await insertInquiryFallback(input);
    } catch (fallbackError) {
      console.warn("Falling back to local consultation storage because Supabase inquiry storage failed.", fallbackError);
      return saveLocalFallbackInquiry(input);
    }
  }
}
