import type { BetaCase, BetaPartner, BetaProviderCandidate } from "@/lib/betaData";

export interface PartnerMvpSnapshot {
  cases: BetaCase[];
  partners: BetaPartner[];
  providers: BetaProviderCandidate[];
  meta?: {
    mode: "supabase";
    partnerRequestCount: number;
    generatedAt: string;
    hasDbPartners: boolean;
    hasDbProviders: boolean;
  };
}

export type PartnerMvpActionSnapshot = PartnerMvpSnapshot;

const ADMIN_TOKEN_KEY = "gph_admin_api_token";

export function readAdminApiToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

export function saveAdminApiToken(token: string) {
  if (typeof window === "undefined") return;
  if (token.trim()) localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function requestPartnerMvp(token: string, init?: RequestInit): Promise<PartnerMvpSnapshot> {
  const response = await fetch("/api/admin/partner-mvp", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Partner MVP API failed with ${response.status}`);
  }

  return payload as PartnerMvpSnapshot;
}

export function fetchPartnerMvpSnapshot(token: string) {
  return requestPartnerMvp(token);
}

export function assignPartnerMvp(token: string, caseId: string, partnerId: string) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "assignPartner", caseId, partnerId }),
  });
}

export function setPartnerShortlistMvp(token: string, caseId: string, partnerId: string, providerIds: string[]) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "setShortlist", caseId, partnerId, providerIds }),
  });
}

export function requestPartnerQuoteMvp(token: string, caseId: string, partnerId: string, providerIds: string[]) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "requestQuotes", caseId, partnerId, providerIds }),
  });
}
