import type { BetaCase, BetaPartner, BetaProviderCandidate } from "@/lib/betaData";

export interface PartnerMvpSnapshot {
  cases: BetaCase[];
  partners: BetaPartner[];
  providers: BetaProviderCandidate[];
  providerQuoteRequests?: ProviderQuoteRequest[];
  quotes?: ProviderQuote[];
  availabilitySlots?: AvailabilitySlot[];
  bookings?: BookingReservation[];
  activities?: CaseActivityEvent[];
  landingRoutes?: ManagedLandingRoute[];
  contactChannels?: ContactChannelSetting[];
  providerOperatingProfiles?: ProviderOperatingProfile[];
  meta?: {
    mode: "supabase";
    role?: OpsRole;
    scopedAccountId?: string | null;
    scopedAccountEnabled?: boolean;
    roleTokensConfigured?: {
      admin: boolean;
      partner: boolean;
      provider: boolean;
      partnerScoped: boolean;
      providerScoped: boolean;
    };
    emailAccessConfigured?: boolean;
    authMethod?: "email" | "legacy_token";
    authEmail?: string | null;
    leadStorageHealth?: {
      patients: number | null;
      leads: number | null;
      cases: number | null;
      medicalIntakes: number | null;
      latestLeadAt: string | null;
      v1PipelineReady: boolean;
      checkedAt: string;
    };
    adminPersistenceHealth?: {
      adminLandingRoutes: number | null;
      contactChannels: number | null;
      providerOperatingProfiles: number | null;
      providerDataQualityChecks: number | null;
      notificationOutbox: number | null;
      ready: boolean;
      checkedAt: string;
    };
    notificationDispatchConfigured?: boolean;
    notificationOutboxConfigured?: boolean;
    stripeConfigured?: boolean;
    paymentMode?: "test" | "live" | "not_configured";
    partnerRequestCount: number;
    quoteRequestCount?: number;
    quoteResponseCount?: number;
    generatedAt: string;
    hasDbPartners: boolean;
    hasDbProviders: boolean;
  };
}

export type PartnerMvpActionSnapshot = PartnerMvpSnapshot;
export type OpsRole = "admin" | "partner" | "provider";
export type LandingRouteStatus = "draft" | "published" | "paused" | "archived";

export interface ManagedLandingRoute {
  id?: string;
  locale: "en" | "jp";
  slug: string;
  market: "japan" | "taiwan";
  intent: string;
  title: string;
  subtitle: string;
  searchTheme: string;
  cta: string;
  secondaryCta: string;
  packageIds: string[];
  status: LandingRouteStatus;
  source?: string;
  active?: boolean;
  publishedAt?: string | null;
  updatedAt?: string;
}

export interface ContactChannelSetting {
  channel: "whatsapp" | "line" | "wechat" | "kakao";
  label: string;
  href: string;
  officialAccountId?: string | null;
  officialVerified: boolean;
  active: boolean;
  displayOrder: number;
  notes?: string | null;
}

export interface ProviderOperatingProfile {
  providerId: string;
  publicExposureStatus: "blocked" | "candidate" | "ready" | "published";
  dataSourceStatus: "demo_seed" | "candidate" | "verified_docs" | "contracted";
  supportedMarkets: string[];
  supportedLanguages: string[];
  standardSlaHours: number;
  urgentSlaHours: number;
  priceRangeUsdMin?: number | null;
  priceRangeUsdMax?: number | null;
  quoteTemplateReady: boolean;
  depositPolicyReady: boolean;
  slaContractStatus: "draft" | "sent" | "negotiating" | "pending_docs" | "signed";
  verificationSummary?: string | null;
  sourceNotes?: string | null;
  lastVerifiedAt?: string | null;
  nextStep?: string | null;
}

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

export type SlotStatus = "available" | "held" | "booked" | "unavailable";
export type VisitType = "consultation" | "procedure" | "surgery" | "checkup";

export interface AvailabilitySlot {
  id: string;
  providerId: string;
  doctorId?: string | null;
  procedureId?: string | null;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  languageSupport: string[];
  holdExpiresAt?: string | null;
  holdCaseId?: string | null;
  holdQuoteId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingReservation {
  id: string;
  caseId: string;
  quoteId: string;
  providerId: string;
  scheduledAt: string;
  visitType: VisitType;
  status: "requested" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "no_show";
  confirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface NotificationInput {
  caseId: string;
  quoteId?: string;
  bookingId?: string;
  channel: "email" | "whatsapp" | "kakao" | "line" | "sms";
  recipient?: string;
  template: string;
  sendAfter?: string;
  deliveryKey?: string;
  payload?: Record<string, unknown>;
}

export interface NotificationResult {
  ok: boolean;
  notificationId: string;
  status: "queued" | "sent" | "failed";
  storage: string;
  dispatchResult?: Record<string, unknown>;
}

export interface DepositCheckoutInput {
  caseId: string;
  quoteId: string;
  providerId?: string;
  depositAmountUsd: number;
}

export interface DepositCheckoutResult {
  ok: boolean;
  checkoutUrl: string;
  sessionId: string;
  paymentMode: "test" | "live" | "not_configured";
}

export interface AvailabilitySlotInput {
  providerId: string;
  startsAt: string;
  endsAt: string;
  languageSupport?: string[];
  status?: SlotStatus;
}

export interface HoldAvailabilitySlotInput {
  slotId: string;
  caseId: string;
  quoteId?: string;
  holdMinutes?: number;
  channel?: NotificationInput["channel"];
  recipient?: string;
}

export interface ReleaseAvailabilitySlotInput {
  slotId: string;
  caseId?: string;
  quoteId?: string;
}

export interface ConfirmHeldBookingInput {
  slotId: string;
  caseId: string;
  quoteId: string;
  visitType: VisitType;
  channel?: NotificationInput["channel"];
  recipient?: string;
}

export interface ReservationActionResult {
  ok: boolean;
  slot?: AvailabilitySlot;
  booking?: BookingReservation;
  notifications?: NotificationResult[];
}

const OPS_ACCESS_TOKEN_KEY = "gcl_ops_access_token:v1";
const OPS_EMAIL_KEY = "gcl_ops_email:v1";
const OPS_ROLE_KEY = "gcl_ops_role";
const LEGACY_ADMIN_TOKEN_KEY = "gcl_admin_api_token";
const ADMIN_API_TIMEOUT_MS = 15000;

export function normalizeOpsRole(value: string | null | undefined): OpsRole {
  return value === "partner" || value === "provider" ? value : "admin";
}

export function opsRoleLabel(role: OpsRole) {
  if (role === "partner") return "파트너";
  if (role === "provider") return "병원";
  return "관리자";
}

export function readOpsRole() {
  if (typeof window === "undefined") return "admin" as OpsRole;
  return normalizeOpsRole(localStorage.getItem(OPS_ROLE_KEY));
}

export function readOpsEmail() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OPS_EMAIL_KEY) ?? "";
}

export function readAdminApiToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OPS_ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY) ?? "";
}

export function saveOpsSession(token: string, role: OpsRole, email?: string | null) {
  if (typeof window === "undefined") return;
  if (token.trim()) localStorage.setItem(OPS_ACCESS_TOKEN_KEY, token.trim());
  else localStorage.removeItem(OPS_ACCESS_TOKEN_KEY);
  localStorage.setItem(OPS_ROLE_KEY, role);
  if (email?.trim()) localStorage.setItem(OPS_EMAIL_KEY, email.trim().toLowerCase());
  else if (email === null) localStorage.removeItem(OPS_EMAIL_KEY);
  localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
}

export function saveAdminApiToken(token: string) {
  saveOpsSession(token, readOpsRole(), readOpsEmail() || undefined);
}

export function clearAdminApiToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OPS_ACCESS_TOKEN_KEY);
  localStorage.removeItem(OPS_EMAIL_KEY);
  localStorage.removeItem(OPS_ROLE_KEY);
  localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
}

async function fetchAdminApi(init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ADMIN_API_TIMEOUT_MS);

  try {
    return await fetch("/api/admin/partner-mvp", { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("관리자 API 응답 시간이 초과했습니다. 잠시 후 다시 시도하세요.");
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("관리자 API 응답 시간이 초과했습니다. 잠시 후 다시 시도하세요.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestPartnerMvpJson<T>(token: string, init?: RequestInit): Promise<T> {
  const response = await fetchAdminApi({
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

  return payload as T;
}

async function requestPartnerMvp(token: string, init?: RequestInit): Promise<PartnerMvpSnapshot> {
  const payload = await requestPartnerMvpJson<PartnerMvpSnapshot>(token, init);
  if (!Array.isArray(payload.cases) || !Array.isArray(payload.partners) || !Array.isArray(payload.providers)) {
    throw new Error("운영 API 응답 형식이 올바르지 않습니다.");
  }
  return payload;
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

export function upsertLandingRouteMvp(token: string, route: ManagedLandingRoute) {
  return requestPartnerMvp(token, {
    method: "POST",
    body: JSON.stringify({ action: "upsertLandingRoute", route }),
  });
}

export function queueNotificationMvp(token: string, input: NotificationInput) {
  return requestPartnerMvpJson<NotificationResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "queueNotification", ...input }),
  }).then((payload) => {
    if (!payload?.notificationId || !payload.status) {
      throw new Error("알림 API 응답 형식이 올바르지 않습니다.");
    }
    return payload;
  });
}

export function createDepositCheckoutMvp(token: string, input: DepositCheckoutInput) {
  return requestPartnerMvpJson<DepositCheckoutResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "createDepositCheckout", ...input }),
  }).then((payload) => {
    if (!payload?.checkoutUrl || !payload.sessionId) {
      throw new Error("예약금 결제 API 응답 형식이 올바르지 않습니다.");
    }
    return payload;
  });
}

export function createAvailabilitySlotMvp(token: string, input: AvailabilitySlotInput) {
  return requestPartnerMvpJson<ReservationActionResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "createAvailabilitySlot", ...input }),
  });
}

export function holdAvailabilitySlotMvp(token: string, input: HoldAvailabilitySlotInput) {
  return requestPartnerMvpJson<ReservationActionResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "holdAvailabilitySlot", ...input }),
  });
}

export function releaseAvailabilitySlotMvp(token: string, input: ReleaseAvailabilitySlotInput) {
  return requestPartnerMvpJson<ReservationActionResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "releaseAvailabilitySlot", ...input }),
  });
}

export function confirmHeldBookingMvp(token: string, input: ConfirmHeldBookingInput) {
  return requestPartnerMvpJson<ReservationActionResult>(token, {
    method: "POST",
    body: JSON.stringify({ action: "confirmHeldBooking", ...input }),
  });
}
