import type { BetaCase, BetaPartner, BetaProviderCandidate } from "@/lib/betaData";

export interface PartnerMvpSnapshot {
  cases: BetaCase[];
  partners: BetaPartner[];
  providers: BetaProviderCandidate[];
  providerQuoteRequests?: ProviderQuoteRequest[];
  quotes?: ProviderQuote[];
  activities?: CaseActivityEvent[];
  meta?: {
    mode: "supabase";
    partnerRequestCount: number;
    quoteRequestCount?: number;
    quoteResponseCount?: number;
    generatedAt: string;
    hasDbPartners: boolean;
    hasDbProviders: boolean;
  };
}

export type PartnerMvpActionSnapshot = PartnerMvpSnapshot;

export interface ProviderQuote {
  id: string;
  quoteRequestId?: string;
  caseId: string;
  providerId: string;
  medicalFeeUsd: number;
  nonmedicalFeeUsd: number;
  commissionRate: number;
  capRate: number;
  depositAmountUsd: number;
  currency: string;
  validUntil: string;
  status: string;
  sentAt?: string;
  notes: string;
  createdAt: string;
}

export interface ProviderQuoteRequest {
  id: string;
  caseId: string;
  providerId: string;
  providerName: string;
  patientAlias: string;
  procedure: string;
  market: string;
  language: string;
  budgetMinUsd: number;
  budgetMaxUsd: number;
  travelStart: string;
  travelEnd: string;
  status: string;
  dueAt?: string;
  requestedAt: string;
  notes: string;
  caseStatus: string;
  quote: ProviderQuote | null;
}

export interface CaseActivityEvent {
  id: string;
  caseId: string;
  actorRole: string;
  actorLabel?: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
  createdAt: string;
}

export interface ProviderQuoteInput {
  quoteRequestId: string;
  caseId: string;
  providerId: string;
  medicalFee: number;
  nonmedicalFee: number;
  currency: string;
  commissionRate: number;
  depositAmount: number;
  validUntil: string;
  notes: string;
}

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

export function advanceCaseStatusMvp(token: string, caseId: string, status: string) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "advanceCaseStatus", caseId, status }),
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

export function submitProviderQuoteMvp(token: string, input: ProviderQuoteInput) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "submitProviderQuote", ...input }),
  });
}
