import type { BetaCaseStatus } from "@/lib/betaData";

const CASE_STATUS_LABELS: Record<string, string> = {
  new: "신규",
  qualified: "상담 가능",
  intake_completed: "문진 완료",
  matching_ready: "매칭 준비",
  matched: "매칭 완료",
  quote_requested: "견적 요청",
  quote_sent: "견적 발송",
  deposit_pending: "예약금 대기",
  deposit_paid: "예약금 결제",
  booking_confirmed: "예약 확정",
  visited: "방문 완료",
  treated: "시술 완료",
  aftercare: "사후관리",
  closed_won: "성사",
  closed_lost: "종료",
};

const GENERIC_STATUS_LABELS: Record<string, string> = {
  signed: "계약 완료",
  sent: "발송 완료",
  accepted: "수락",
  paid: "결제 완료",
  confirmed: "확정",
  reconciled: "정산 확인",
  pending: "대기",
  requested: "요청됨",
  responded: "응답 완료",
  draft: "초안",
  unreconciled: "미정산",
  negotiating: "협의 중",
  pending_docs: "서류 대기",
  registration: "등록 확인",
  registration_pending: "등록 대기",
  insurance: "보험 확인",
  increase: "확대",
  hold: "유지",
  reduce: "축소",
  stop: "중단",
  running: "진행 중",
  paused: "중지",
  ready: "준비 완료",
  published: "게시됨",
  verified: "검증 완료",
  rejected: "반려",
  active: "활성",
  inactive: "비활성",
};

const PARTNER_MODE_LABELS: Record<string, string> = {
  platform_direct: "플랫폼 직접 매칭",
  partner_requested: "환자 파트너 지원 요청",
  partner_originated: "파트너 유입",
  partner_managed: "파트너 관리 케이스",
};

const PARTNER_SERVICE_LABELS: Record<string, string> = {
  medical_agency: "의료 에이전시",
  personal_agent: "개인 에이전트",
  interpreter: "통역",
  travel_agency: "여행사",
  airport_pickup: "공항 픽업",
  hotel_recovery: "호텔/회복 지원",
  concierge: "컨시어지",
  none: "없음",
};

const PARTNER_TYPE_LABELS: Record<string, string> = {
  agency: "에이전시",
  personal_agent: "개인 에이전트",
  interpreter: "통역사",
  travel_agency: "여행사",
  concierge: "컨시어지",
};

const EVENT_LABELS: Record<string, string> = {
  partner_assigned: "파트너 배정",
  partner_removed: "파트너 배정 해제",
  partner_shortlist_updated: "병원 후보 업데이트",
  quote_requested: "병원 견적 요청",
  provider_quote_submitted: "병원 견적 제출",
  provider_quote_revised: "병원 견적 수정",
  case_status_changed: "케이스 상태 변경",
};

const ACTOR_LABELS: Record<string, string> = {
  system: "시스템",
  admin: "관리자",
  coordinator: "코디네이터",
  partner: "파트너",
  provider: "병원",
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  "Partner assigned; review provider shortlist": "파트너 배정 완료, 병원 후보를 검토하세요",
  "Assign partner for requested services": "요청 서비스에 맞는 파트너를 배정하세요",
  "Coordinator to request quotes from partner shortlist": "파트너가 고른 병원 후보에 견적을 요청하세요",
  "Partner should select provider candidates": "파트너가 병원 후보를 선택해야 합니다",
  "Provider quote SLA check": "병원 견적 응답 기준을 확인하세요",
  "Continue coordinator qualification": "코디네이터가 상담 가능 여부를 계속 확인하세요",
  "Follow up quote acceptance": "견적 수락 여부를 확인하세요",
};

const MARKET_LABELS: Record<string, string> = {
  japan: "일본",
  taiwan: "대만",
  global: "글로벌",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "영어",
  jp: "일본어",
  ja: "일본어",
  ko: "한국어",
  zh: "중국어",
  "zh-tw": "중국어(번체)",
  "zh-cn": "중국어(간체)",
};

const RISK_FLAG_LABELS: Record<string, string> = {
  "partner consent needed": "파트너 공유 동의 필요",
  "low budget": "예산 확인 필요",
  "language support": "언어 지원 확인 필요",
  "travel window": "방문 일정 확인 필요",
};

const PROVIDER_NEXT_STEP_LABELS: Record<string, string> = {
  "Collect signed SLA addendum": "서명된 응답 기준 부속합의서 수집",
  "Confirm deposit refund wording": "예약금 환불 문구 확인",
  "Send first SLA draft": "1차 응답 기준 초안 발송",
  "Verify insurance before assigning cases": "케이스 배정 전 보험 서류 확인",
  "Finalize quote template": "견적 템플릿 최종 확정",
};

const QUOTE_NOTE_LABELS: Record<string, string> = {
  "Final treatment plan and price may change after provider consultation.": "최종 시술 계획과 금액은 병원 상담 후 변경될 수 있습니다.",
};

export function caseStatusLabel(status?: string) {
  if (!status) return "-";
  return CASE_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function statusLabel(status?: string) {
  if (!status) return "-";
  return CASE_STATUS_LABELS[status] ?? GENERIC_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function partnerModeLabel(value?: string) {
  if (!value) return PARTNER_MODE_LABELS.platform_direct;
  return PARTNER_MODE_LABELS[value] ?? value.replaceAll("_", " ");
}

export function partnerServiceLabel(value: string) {
  return PARTNER_SERVICE_LABELS[value] ?? value.replaceAll("_", " ");
}

export function partnerTypeLabel(value?: string) {
  if (!value) return "-";
  return PARTNER_TYPE_LABELS[value] ?? value.replaceAll("_", " ");
}

export function eventLabel(value?: string) {
  if (!value) return "-";
  return EVENT_LABELS[value] ?? value.replaceAll("_", " ");
}

export function actorLabel(value?: string) {
  if (!value) return "-";
  return ACTOR_LABELS[value] ?? value;
}

export function nextActionLabel(value?: string) {
  if (!value) return "-";
  if (value.startsWith("Move to ")) return `${caseStatusLabel(value.replace("Move to ", "") as BetaCaseStatus)} 단계로 이동`;
  return NEXT_ACTION_LABELS[value] ?? value;
}

export function marketLabel(value?: string) {
  if (!value) return "-";
  return MARKET_LABELS[value.toLowerCase()] ?? value;
}

export function languageLabel(value?: string) {
  if (!value) return "-";
  const key = value.toLowerCase().replace("_", "-");
  return LANGUAGE_LABELS[key] ?? value;
}

export function languageListLabel(values?: string[]) {
  if (!values?.length) return "-";
  return values.map(languageLabel).join(", ");
}

export function riskFlagLabel(value: string) {
  return RISK_FLAG_LABELS[value] ?? value.replaceAll("_", " ");
}

export function providerNextStepLabel(value?: string) {
  if (!value) return "-";
  return PROVIDER_NEXT_STEP_LABELS[value] ?? value;
}

export function quoteNoteLabel(value?: string) {
  if (!value) return "-";
  return QUOTE_NOTE_LABELS[value] ?? value;
}

export function yesNoLabel(value: boolean) {
  return value ? "예" : "아니오";
}
