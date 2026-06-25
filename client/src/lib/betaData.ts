export type SlaStatus = "draft" | "sent" | "negotiating" | "pending_docs" | "signed";
export type BetaCaseStatus =
  | "new"
  | "qualified"
  | "intake_completed"
  | "matching_ready"
  | "quote_requested"
  | "quote_sent"
  | "deposit_pending"
  | "deposit_paid"
  | "booking_confirmed"
  | "visited"
  | "closed_lost";

export interface BetaProviderCandidate {
  id: string;
  name: string;
  nameLegal?: string;
  nameDisplayKo?: string;
  nameDisplayEn?: string;
  facilityType?: "clinic" | "hospital" | "general_hospital" | "tertiary_hospital";
  address?: string;
  city?: string;
  district?: string;
  countryCode?: string;
  defaultCommissionCapRate?: number;
  qualityScore?: number;
  opsEmail?: string;
  region: string;
  specialty: string;
  registrationVerified: boolean;
  medicalKoreaRegistered?: boolean;
  insuranceVerified: boolean;
  languages: string[];
  slaHours: number;
  urgentSlaHours: number;
  quoteTemplateReady: boolean;
  depositPolicyReady: boolean;
  slaStatus: SlaStatus;
  active: boolean;
  betaScore: number;
  owner: string;
  nextStep: string;
  matchedCases: number;
  quotesSent: number;
  depositsPaid: number;
  slaBreaches: number;
  complaints: number;
  platformRevenueUsd: number;
}

export interface BetaPartner {
  id: string;
  name: string;
  type: "agency" | "personal_agent" | "interpreter" | "travel_agency" | "concierge";
  contactEmail?: string;
  contactPhone?: string;
  defaultRevenueShareRate?: number;
  opsEmail?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  languages: string[];
  markets: string[];
  services: string[];
  preferredProviderIds: string[];
  active: boolean;
  slaHours: number;
}

export interface BetaCase {
  id: string;
  leadId: string;
  patientAlias: string;
  owner: string;
  status: BetaCaseStatus;
  priority: "normal" | "high" | "urgent";
  locale: "en" | "jp";
  market: "japan" | "taiwan";
  source: string;
  campaign: string;
  landingPath: string;
  packageId: string;
  procedure: string;
  language: string;
  budgetMinUsd: number;
  budgetMaxUsd: number;
  travelStart: string;
  travelEnd: string;
  matchedProviderId?: string;
  partnerAssistanceMode?: "platform_direct" | "partner_requested" | "partner_originated" | "partner_managed";
  requestedPartnerServices?: string[];
  partnerShareConsent?: boolean;
  assignedPartnerId?: string;
  partnerShortlistedProviderIds?: string[];
  quoteRequestedProviderIds?: string[];
  firstResponseMinutes: number;
  nextAction: string;
  nextActionAt: string;
  riskFlags: string[];
}

export interface BetaQuote {
  id: string;
  caseId: string;
  providerId: string;
  medicalFeeUsd: number;
  nonmedicalFeeUsd: number;
  commissionRate: number;
  capRate: number;
  depositAmountUsd: number;
  validUntil: string;
  status: "draft" | "sent" | "accepted" | "expired" | "cancelled";
  sentAt?: string;
  notes: string;
}

export interface BetaDepositBooking {
  paymentId: string;
  bookingId: string;
  caseId: string;
  quoteId: string;
  depositStatus: "pending" | "paid" | "failed" | "refunded";
  depositAmountUsd: number;
  paidAt?: string;
  scheduledAt?: string;
  visitType: "consultation" | "procedure" | "recovery";
  bookingStatus: "requested" | "confirmed" | "completed" | "cancelled";
  refundStatus: "none" | "requested" | "refunded";
}

export interface BetaLedgerRow {
  id: string;
  providerId: string;
  caseId: string;
  quoteId: string;
  grossMedicalFeeUsd: number;
  commissionRate: number;
  commissionAmountUsd: number;
  partnerPayoutUsd: number;
  paymentFeeUsd: number;
  refundCostUsd: number;
  settlementStatus: "draft" | "reconciled" | "unreconciled" | "paid";
}

export interface LeadTestSegment {
  segment: string;
  targetLeads: number;
  currentLeads: number;
  locale: "en" | "jp" | "en/jp";
  primaryRoute: string;
  targetQualifiedRate: number;
  targetDepositRate: number;
  status: "ready" | "running" | "paused";
}

export interface ChannelRanking {
  source: string;
  campaign: string;
  leads: number;
  qualifiedRate: number;
  quoteRate: number;
  depositRate: number;
  cacUsd: number;
  platformRevenueUsd: number;
  contributionProfitUsd: number;
  budgetAction: "increase" | "hold" | "reduce" | "stop";
}

export const betaTargets = {
  leads: 300,
  qualifiedCases: 150,
  quoteRequests: 80,
  quotesSent: 45,
  depositsPaid: 15,
  bookingsConfirmed: 15,
  complianceIncidents: 0,
};

export const betaProviders: BetaProviderCandidate[] = [
  {
    id: "prov-001",
    name: "Lumen Skin Center",
    region: "Gangnam",
    specialty: "Dermatology",
    registrationVerified: true,
    insuranceVerified: true,
    languages: ["ja", "en", "ko", "zh"],
    slaHours: 6,
    urgentSlaHours: 4,
    quoteTemplateReady: true,
    depositPolicyReady: true,
    slaStatus: "sent",
    active: true,
    betaScore: 92,
    owner: "Biz",
    nextStep: "Collect signed SLA addendum",
    matchedCases: 4,
    quotesSent: 3,
    depositsPaid: 1,
    slaBreaches: 0,
    complaints: 0,
    platformRevenueUsd: 312,
  },
  {
    id: "prov-002",
    name: "Prime Skin Gangnam",
    region: "Gangnam",
    specialty: "Dermatology",
    registrationVerified: true,
    insuranceVerified: true,
    languages: ["ja", "en", "ko"],
    slaHours: 8,
    urgentSlaHours: 4,
    quoteTemplateReady: true,
    depositPolicyReady: false,
    slaStatus: "negotiating",
    active: true,
    betaScore: 86,
    owner: "Biz",
    nextStep: "Confirm deposit refund wording",
    matchedCases: 3,
    quotesSent: 2,
    depositsPaid: 1,
    slaBreaches: 0,
    complaints: 0,
    platformRevenueUsd: 247,
  },
  {
    id: "prov-003",
    name: "Seoul Glow Dermatology",
    region: "Gangnam",
    specialty: "Dermatology",
    registrationVerified: true,
    insuranceVerified: true,
    languages: ["en", "zh", "ko"],
    slaHours: 12,
    urgentSlaHours: 4,
    quoteTemplateReady: true,
    depositPolicyReady: true,
    slaStatus: "draft",
    active: true,
    betaScore: 84,
    owner: "Ops",
    nextStep: "Send first SLA draft",
    matchedCases: 2,
    quotesSent: 1,
    depositsPaid: 0,
    slaBreaches: 0,
    complaints: 0,
    platformRevenueUsd: 0,
  },
  {
    id: "prov-004",
    name: "Apgujeong Laser Clinic",
    region: "Gangnam",
    specialty: "Dermatology",
    registrationVerified: true,
    insuranceVerified: false,
    languages: ["ja", "en", "ko"],
    slaHours: 12,
    urgentSlaHours: 6,
    quoteTemplateReady: true,
    depositPolicyReady: false,
    slaStatus: "pending_docs",
    active: false,
    betaScore: 72,
    owner: "Ops",
    nextStep: "Verify insurance before assigning cases",
    matchedCases: 1,
    quotesSent: 0,
    depositsPaid: 0,
    slaBreaches: 1,
    complaints: 0,
    platformRevenueUsd: 0,
  },
  {
    id: "prov-005",
    name: "Cheongdam Derm Wellness",
    region: "Gangnam",
    specialty: "Dermatology + Recovery",
    registrationVerified: true,
    insuranceVerified: true,
    languages: ["ja", "en", "zh", "ko"],
    slaHours: 8,
    urgentSlaHours: 4,
    quoteTemplateReady: false,
    depositPolicyReady: true,
    slaStatus: "sent",
    active: true,
    betaScore: 88,
    owner: "Ops",
    nextStep: "Finalize quote template",
    matchedCases: 2,
    quotesSent: 1,
    depositsPaid: 0,
    slaBreaches: 0,
    complaints: 0,
    platformRevenueUsd: 0,
  },
];

export const betaPartners: BetaPartner[] = [
  {
    id: "partner-001",
    name: "Tokyo Care Bridge",
    type: "agency",
    verificationStatus: "verified",
    languages: ["ja", "en", "ko"],
    markets: ["japan"],
    services: ["medical_agency", "personal_agent", "interpreter"],
    preferredProviderIds: ["prov-001", "prov-002"],
    active: true,
    slaHours: 4,
  },
  {
    id: "partner-002",
    name: "Taipei Wellness Travel",
    type: "travel_agency",
    verificationStatus: "verified",
    languages: ["zh", "en", "ko"],
    markets: ["taiwan"],
    services: ["travel_agency", "airport_pickup", "hotel_recovery"],
    preferredProviderIds: ["prov-003", "prov-005"],
    active: true,
    slaHours: 6,
  },
  {
    id: "partner-003",
    name: "Seoul Med Interpreter Pool",
    type: "interpreter",
    verificationStatus: "pending",
    languages: ["ja", "zh", "en", "ko"],
    markets: ["japan", "taiwan"],
    services: ["interpreter", "concierge"],
    preferredProviderIds: ["prov-001", "prov-005"],
    active: true,
    slaHours: 8,
  },
];

export const betaCases: BetaCase[] = [
  {
    id: "case-0001",
    leadId: "lead-0001",
    patientAlias: "JP Laser A",
    owner: "Mina",
    status: "quote_sent",
    priority: "high",
    locale: "jp",
    market: "japan",
    source: "paid_search",
    campaign: "jp_laser_toning_test",
    landingPath: "/jp/korea-laser-toning-package",
    packageId: "jp-skin-01",
    procedure: "Laser toning",
    language: "ja",
    budgetMinUsd: 700,
    budgetMaxUsd: 1200,
    travelStart: "2026-07-10",
    travelEnd: "2026-07-12",
    matchedProviderId: "prov-001",
    partnerAssistanceMode: "platform_direct",
    requestedPartnerServices: [],
    partnerShareConsent: false,
    firstResponseMinutes: 4,
    nextAction: "Follow up quote acceptance",
    nextActionAt: "2026-06-10 18:00",
    riskFlags: [],
  },
  {
    id: "case-0002",
    leadId: "lead-0002",
    patientAlias: "TW Booster A",
    owner: "Jin",
    status: "matching_ready",
    priority: "normal",
    locale: "en",
    market: "taiwan",
    source: "seo",
    campaign: "tw_skin_booster",
    landingPath: "/en/korea-skin-booster-package",
    packageId: "tw-skin-01",
    procedure: "Skin booster",
    language: "en",
    budgetMinUsd: 900,
    budgetMaxUsd: 1800,
    travelStart: "2026-07-18",
    travelEnd: "2026-07-21",
    partnerAssistanceMode: "partner_requested",
    requestedPartnerServices: ["interpreter", "travel_agency", "hotel_recovery"],
    partnerShareConsent: true,
    assignedPartnerId: "partner-002",
    partnerShortlistedProviderIds: ["prov-003", "prov-005"],
    firstResponseMinutes: 7,
    nextAction: "Coordinator to request quotes from partner shortlist",
    nextActionAt: "2026-06-10 16:00",
    riskFlags: [],
  },
  {
    id: "case-0003",
    leadId: "lead-0003",
    patientAlias: "JP Booster B",
    owner: "Mina",
    status: "deposit_paid",
    priority: "high",
    locale: "jp",
    market: "japan",
    source: "referral",
    campaign: "jp_weekend_skin",
    landingPath: "/jp/seoul-anti-aging-skin-package",
    packageId: "jp-skin-02",
    procedure: "Skin booster",
    language: "ja",
    budgetMinUsd: 1200,
    budgetMaxUsd: 2200,
    travelStart: "2026-07-05",
    travelEnd: "2026-07-08",
    matchedProviderId: "prov-002",
    partnerAssistanceMode: "partner_originated",
    requestedPartnerServices: ["medical_agency", "interpreter"],
    partnerShareConsent: true,
    assignedPartnerId: "partner-001",
    partnerShortlistedProviderIds: ["prov-001", "prov-002"],
    quoteRequestedProviderIds: ["prov-002"],
    firstResponseMinutes: 5,
    nextAction: "Pre-visit confirmation",
    nextActionAt: "2026-07-03 09:00",
    riskFlags: [],
  },
  {
    id: "case-0004",
    leadId: "lead-0004",
    patientAlias: "JP Scar C",
    owner: "Sora",
    status: "qualified",
    priority: "normal",
    locale: "jp",
    market: "japan",
    source: "paid_social",
    campaign: "jp_acne_scar",
    landingPath: "/jp/korea-acne-scar-laser-package",
    packageId: "jp-skin-03",
    procedure: "Acne scar laser",
    language: "ja",
    budgetMinUsd: 1500,
    budgetMaxUsd: 3000,
    travelStart: "2026-08-02",
    travelEnd: "2026-08-06",
    partnerAssistanceMode: "partner_requested",
    requestedPartnerServices: ["personal_agent", "interpreter"],
    partnerShareConsent: false,
    firstResponseMinutes: 3,
    nextAction: "Collect intake, photo consent, and partner-sharing consent",
    nextActionAt: "2026-06-10 17:30",
    riskFlags: ["photo_consent_pending"],
  },
  {
    id: "case-0005",
    leadId: "lead-0005",
    patientAlias: "TW Recovery B",
    owner: "Jin",
    status: "quote_requested",
    priority: "normal",
    locale: "en",
    market: "taiwan",
    source: "partner",
    campaign: "tw_recovery_addon",
    landingPath: "/en/seoul-anti-aging-skin-package",
    packageId: "tw-skin-02",
    procedure: "Recovery add-on",
    language: "en",
    budgetMinUsd: 1500,
    budgetMaxUsd: 3000,
    travelStart: "2026-07-22",
    travelEnd: "2026-07-25",
    matchedProviderId: "prov-005",
    partnerAssistanceMode: "partner_managed",
    requestedPartnerServices: ["travel_agency", "airport_pickup", "hotel_recovery"],
    partnerShareConsent: true,
    assignedPartnerId: "partner-002",
    partnerShortlistedProviderIds: ["prov-005"],
    quoteRequestedProviderIds: ["prov-005"],
    firstResponseMinutes: 9,
    nextAction: "Provider quote SLA check",
    nextActionAt: "2026-06-11 09:00",
    riskFlags: [],
  },
  {
    id: "case-0006",
    leadId: "lead-0006",
    patientAlias: "JP Laser D",
    owner: "Mina",
    status: "deposit_pending",
    priority: "urgent",
    locale: "jp",
    market: "japan",
    source: "retargeting",
    campaign: "jp_laser_return",
    landingPath: "/jp/korea-laser-toning-package",
    packageId: "jp-skin-01",
    procedure: "Laser toning",
    language: "ja",
    budgetMinUsd: 700,
    budgetMaxUsd: 1200,
    travelStart: "2026-06-28",
    travelEnd: "2026-06-30",
    matchedProviderId: "prov-001",
    partnerAssistanceMode: "platform_direct",
    requestedPartnerServices: [],
    partnerShareConsent: false,
    firstResponseMinutes: 2,
    nextAction: "Send 24h deposit follow-up",
    nextActionAt: "2026-06-11 10:00",
    riskFlags: [],
  },
];

export const betaQuotes: BetaQuote[] = [
  {
    id: "quote-0001",
    caseId: "case-0001",
    providerId: "prov-001",
    medicalFeeUsd: 980,
    nonmedicalFeeUsd: 80,
    commissionRate: 0.15,
    capRate: 0.3,
    depositAmountUsd: 150,
    validUntil: "2026-06-20",
    status: "sent",
    sentAt: "2026-06-10 11:00",
    notes: "Final plan may change after provider consultation.",
  },
  {
    id: "quote-0002",
    caseId: "case-0003",
    providerId: "prov-002",
    medicalFeeUsd: 1600,
    nonmedicalFeeUsd: 120,
    commissionRate: 0.16,
    capRate: 0.3,
    depositAmountUsd: 300,
    validUntil: "2026-06-22",
    status: "accepted",
    sentAt: "2026-06-10 12:50",
    notes: "Deposit paid; visit confirmation pending.",
  },
  {
    id: "quote-0003",
    caseId: "case-0006",
    providerId: "prov-001",
    medicalFeeUsd: 860,
    nonmedicalFeeUsd: 60,
    commissionRate: 0.14,
    capRate: 0.3,
    depositAmountUsd: 120,
    validUntil: "2026-06-16",
    status: "accepted",
    sentAt: "2026-06-10 14:20",
    notes: "Patient asked for deposit payment link.",
  },
];

export const betaDepositBookings: BetaDepositBooking[] = [
  {
    paymentId: "pay-0001",
    bookingId: "book-0001",
    caseId: "case-0003",
    quoteId: "quote-0002",
    depositStatus: "paid",
    depositAmountUsd: 300,
    paidAt: "2026-06-10 13:10",
    scheduledAt: "2026-07-06 10:30",
    visitType: "procedure",
    bookingStatus: "confirmed",
    refundStatus: "none",
  },
  {
    paymentId: "pay-0002",
    bookingId: "book-0002",
    caseId: "case-0006",
    quoteId: "quote-0003",
    depositStatus: "pending",
    depositAmountUsd: 120,
    scheduledAt: "2026-06-29 11:00",
    visitType: "procedure",
    bookingStatus: "requested",
    refundStatus: "none",
  },
];

export const betaLedger: BetaLedgerRow[] = [
  {
    id: "ledger-0001",
    providerId: "prov-002",
    caseId: "case-0003",
    quoteId: "quote-0002",
    grossMedicalFeeUsd: 1600,
    commissionRate: 0.16,
    commissionAmountUsd: 256,
    partnerPayoutUsd: 0,
    paymentFeeUsd: 9,
    refundCostUsd: 0,
    settlementStatus: "reconciled",
  },
];

export const leadTestSegments: LeadTestSegment[] = [
  {
    segment: "Japan laser toning",
    targetLeads: 75,
    currentLeads: 2,
    locale: "jp",
    primaryRoute: "/jp/korea-laser-toning-package",
    targetQualifiedRate: 0.5,
    targetDepositRate: 0.05,
    status: "ready",
  },
  {
    segment: "Japan skin booster",
    targetLeads: 75,
    currentLeads: 2,
    locale: "jp",
    primaryRoute: "/jp/korea-skin-booster-package",
    targetQualifiedRate: 0.5,
    targetDepositRate: 0.05,
    status: "ready",
  },
  {
    segment: "Japan acne scar laser",
    targetLeads: 40,
    currentLeads: 1,
    locale: "jp",
    primaryRoute: "/jp/korea-acne-scar-laser-package",
    targetQualifiedRate: 0.45,
    targetDepositRate: 0.035,
    status: "ready",
  },
  {
    segment: "Taiwan skin booster",
    targetLeads: 60,
    currentLeads: 1,
    locale: "en",
    primaryRoute: "/en/korea-skin-booster-package",
    targetQualifiedRate: 0.45,
    targetDepositRate: 0.04,
    status: "ready",
  },
  {
    segment: "Taiwan recovery add-on",
    targetLeads: 30,
    currentLeads: 1,
    locale: "en",
    primaryRoute: "/en/seoul-anti-aging-skin-package",
    targetQualifiedRate: 0.4,
    targetDepositRate: 0.03,
    status: "ready",
  },
  {
    segment: "Retargeting / referral",
    targetLeads: 20,
    currentLeads: 1,
    locale: "en/jp",
    primaryRoute: "/en/korea-skin-clinic-gangnam",
    targetQualifiedRate: 0.55,
    targetDepositRate: 0.06,
    status: "ready",
  },
];

export const channelRankings: ChannelRanking[] = [
  {
    source: "referral",
    campaign: "jp_weekend_skin",
    leads: 1,
    qualifiedRate: 1,
    quoteRate: 1,
    depositRate: 1,
    cacUsd: 20,
    platformRevenueUsd: 247,
    contributionProfitUsd: 198,
    budgetAction: "increase",
  },
  {
    source: "paid_search",
    campaign: "jp_laser_toning_test",
    leads: 2,
    qualifiedRate: 1,
    quoteRate: 1,
    depositRate: 0,
    cacUsd: 45,
    platformRevenueUsd: 129,
    contributionProfitUsd: 39,
    budgetAction: "hold",
  },
  {
    source: "seo",
    campaign: "tw_skin_booster",
    leads: 1,
    qualifiedRate: 1,
    quoteRate: 0,
    depositRate: 0,
    cacUsd: 0,
    platformRevenueUsd: 0,
    contributionProfitUsd: 0,
    budgetAction: "hold",
  },
  {
    source: "paid_social",
    campaign: "jp_acne_scar",
    leads: 1,
    qualifiedRate: 1,
    quoteRate: 0,
    depositRate: 0,
    cacUsd: 62,
    platformRevenueUsd: 0,
    contributionProfitUsd: -62,
    budgetAction: "reduce",
  },
];

export function getProvider(providerId?: string) {
  return betaProviders.find((provider) => provider.id === providerId);
}

export function getPartner(partnerId?: string) {
  return betaPartners.find((partner) => partner.id === partnerId);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function providerDepositRate(provider: BetaProviderCandidate) {
  return provider.matchedCases ? provider.depositsPaid / provider.matchedCases : 0;
}

export function providerQuoteRate(provider: BetaProviderCandidate) {
  return provider.matchedCases ? provider.quotesSent / provider.matchedCases : 0;
}

export function ledgerNet(row: BetaLedgerRow) {
  return row.commissionAmountUsd - row.partnerPayoutUsd - row.paymentFeeUsd - row.refundCostUsd;
}
