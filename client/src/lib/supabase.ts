export interface InquiryInput {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  preferredLanguage: string;
  treatmentInterest?: string;
  hospitalSlug?: string;
  preferredDate?: string;
  budget?: string;
  message?: string;
  consent: boolean;
}

export interface InquiryResult {
  saved: boolean;
  demoMode: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toRecord(input: InquiryInput) {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: clean(input.phone),
    nationality: clean(input.nationality),
    preferred_language: input.preferredLanguage,
    treatment_interest: clean(input.treatmentInterest),
    hospital_slug: clean(input.hospitalSlug),
    preferred_date: clean(input.preferredDate),
    budget: clean(input.budget),
    message: clean(input.message),
    consent: input.consent,
    source_path: typeof window === "undefined" ? null : window.location.pathname,
    utm: typeof window === "undefined" ? {} : Object.fromEntries(new URLSearchParams(window.location.search)),
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

export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  if (!isSupabaseConfigured()) {
    saveLocalDemoInquiry(input);
    return { saved: true, demoMode: true };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/inquiries`, {
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
    throw new Error(details || `Supabase request failed with ${response.status}`);
  }

  return { saved: true, demoMode: false };
}
