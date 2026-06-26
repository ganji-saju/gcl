import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardList,
  Database,
  Filter,
  Handshake,
  Languages,
  Send,
  UserRoundCheck,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  betaCases,
  betaPartners,
  betaProviders,
  type BetaCase,
  type BetaCaseStatus,
  formatUsd,
} from "@/lib/betaData";
import {
  advanceCaseStatusMvp,
  assignPartnerMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  requestPartnerQuoteMvp,
  setPartnerShortlistMvp,
  type CaseActivityEvent,
  type PartnerMvpSnapshot,
  type ProviderQuoteRequest,
} from "@/lib/partnerMvpApi";
import {
  actorLabel,
  caseStatusLabel,
  eventLabel,
  languageLabel,
  languageListLabel,
  marketLabel,
  nextActionLabel,
  partnerModeLabel,
  partnerServiceLabel,
  partnerTypeLabel,
  riskFlagLabel,
  statusLabel,
} from "@/lib/adminLabels";
import { cn } from "@/lib/utils";

const statusOrder: BetaCaseStatus[] = [
  "new",
  "qualified",
  "intake_completed",
  "matching_ready",
  "quote_requested",
  "quote_sent",
  "deposit_pending",
  "deposit_paid",
  "booking_confirmed",
  "visited",
  "closed_lost",
];

const visibleStatuses: BetaCaseStatus[] = [
  "qualified",
  "matching_ready",
  "quote_requested",
  "quote_sent",
  "deposit_pending",
  "deposit_paid",
  "booking_confirmed",
];

function statusClass(status: BetaCaseStatus) {
  if (status === "deposit_paid" || status === "booking_confirmed")
    return "border-teal-200 bg-teal-50 text-teal-800";
  if (status === "deposit_pending" || status === "quote_sent")
    return "border-coral-200 bg-coral-50 text-coral-800";
  if (status === "closed_lost") return "border-ink-300 bg-ink-100 text-ink-600";
  return "border-ink-200 bg-white text-ink-700";
}

function StatusPill({ status }: { status: BetaCaseStatus }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        statusClass(status)
      )}
    >
      {caseStatusLabel(status)}
    </span>
  );
}

function nextStatus(status: BetaCaseStatus): BetaCaseStatus {
  const index = statusOrder.indexOf(status);
  return statusOrder[Math.min(index + 1, statusOrder.length - 1)];
}

function CaseRow({
  row,
  selected,
  onSelect,
  providersById,
  partnersById,
}: {
  row: BetaCase;
  selected: boolean;
  onSelect: () => void;
  providersById: Map<string, { name: string }>;
  partnersById: Map<string, { name: string }>;
}) {
  const provider = row.matchedProviderId
    ? providersById.get(row.matchedProviderId)
    : undefined;
  const partner = row.assignedPartnerId
    ? partnersById.get(row.assignedPartnerId)
    : undefined;
  const slaRisk =
    row.status === "quote_requested" ||
    row.firstResponseMinutes > 5 ||
    row.riskFlags.length > 0;
  const partnerRequested =
    row.partnerAssistanceMode &&
    row.partnerAssistanceMode !== "platform_direct";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-4 border-b border-ink-100 p-4 text-left transition-colors md:grid-cols-[1.05fr_0.75fr_0.8fr_0.7fr_0.9fr]",
        selected ? "bg-teal-50/60" : "bg-white hover:bg-ink-50"
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-950">{row.id}</span>
          <StatusPill status={row.status} />
        </div>
        <div className="mt-1 text-sm text-ink-500">
          {row.patientAlias} / {row.packageId}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">
          {row.procedure}
        </div>
        <div className="text-xs text-ink-500">
          {marketLabel(row.market)} / {languageLabel(row.locale)} /{" "}
          {languageLabel(row.language)}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">
          {provider?.name ?? "미매칭"}
        </div>
        <div className="text-xs text-ink-500">
          {partnerRequested ? (partner?.name ?? "파트너 요청") : row.source} /{" "}
          {row.campaign}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">
          {formatUsd(row.budgetMinUsd)} - {formatUsd(row.budgetMaxUsd)}
        </div>
        <div className="text-xs text-ink-500">
          {row.travelStart} ~ {row.travelEnd}
        </div>
      </div>
      <div>
        <div
          className={cn(
            "whitespace-nowrap text-sm font-semibold",
            slaRisk ? "text-coral-700" : "text-teal-700"
          )}
        >
          {slaRisk ? "응답 지연 확인" : "정상 진행"}
        </div>
        <div className="text-xs text-ink-500">{row.nextActionAt}</div>
      </div>
    </button>
  );
}

export default function CaseDashboard() {
  const [cases, setCases] = useState(betaCases);
  const [partners, setPartners] = useState(betaPartners);
  const [providers, setProviders] = useState(betaProviders);
  const [quoteRequests, setQuoteRequests] = useState<ProviderQuoteRequest[]>(
    []
  );
  const [activities, setActivities] = useState<CaseActivityEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<BetaCaseStatus | "all">(
    "all"
  );
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [adminToken] = useState(() => readAdminApiToken());
  const [apiStatus, setApiStatus] = useState<
    "demo" | "loading" | "live" | "saving" | "error"
  >(adminToken ? "loading" : "demo");
  const [apiMessage, setApiMessage] = useState(
    adminToken ? "Supabase 운영 데이터에 연결 중..." : "데모 보드"
  );

  const owners = useMemo(
    () => Array.from(new Set(cases.map(row => row.owner))),
    [cases]
  );
  const providersById = useMemo(
    () => new Map(providers.map(provider => [provider.id, provider])),
    [providers]
  );
  const partnersById = useMemo(
    () => new Map(partners.map(partner => [partner.id, partner])),
    [partners]
  );
  const filtered = cases.filter(row => {
    const statusMatch = statusFilter === "all" || row.status === statusFilter;
    const ownerMatch = ownerFilter === "all" || row.owner === ownerFilter;
    return statusMatch && ownerMatch;
  });
  const selected =
    cases.find(row => row.id === selectedId) ?? filtered[0] ?? cases[0];
  const selectedProvider = selected?.matchedProviderId
    ? providersById.get(selected.matchedProviderId)
    : undefined;
  const selectedQuoteRequests = quoteRequests.filter(
    row => row.caseId === selected?.id
  );
  const selectedActivities = activities
    .filter(row => row.caseId === selected?.id)
    .slice(0, 6);
  const liveMode = Boolean(adminToken && apiStatus !== "demo");

  function applySnapshot(snapshot: PartnerMvpSnapshot) {
    if (snapshot.cases.length) {
      setCases(snapshot.cases);
      setSelectedId(current =>
        snapshot.cases.some(row => row.id === current)
          ? current
          : (snapshot.cases[0]?.id ?? "")
      );
    }
    if (snapshot.partners.length) setPartners(snapshot.partners);
    if (snapshot.providers.length) setProviders(snapshot.providers);
    setQuoteRequests(snapshot.providerQuoteRequests ?? []);
    setActivities(snapshot.activities ?? []);
    setApiStatus("live");
    setApiMessage(
      `Supabase 운영 연결됨: 파트너 요청 ${snapshot.meta?.partnerRequestCount ?? snapshot.cases.length}건 / 견적 요청 ${snapshot.meta?.quoteRequestCount ?? 0}건`
    );
  }

  async function refreshOps(token = adminToken) {
    if (!token) return;
    setApiStatus("loading");
    setApiMessage("Supabase 파트너 요청을 불러오는 중...");
    try {
      const snapshot = await fetchPartnerMvpSnapshot(token);
      applySnapshot(snapshot);
    } catch (error) {
      setApiStatus("error");
      setApiMessage("운영 데이터 로드 실패: 연결 설정을 확인하세요.");
    }
  }

  useEffect(() => {
    if (adminToken) void refreshOps(adminToken);
  }, [adminToken]);

  function applySnapshotAfterSave(snapshot: PartnerMvpSnapshot) {
    applySnapshot(snapshot);
    setApiMessage("Supabase에 저장되었습니다");
  }

  async function advanceSelected() {
    if (!selected) return;
    const target = nextStatus(selected.status);
    const nextAction = `Move to ${target}`;

    if (!adminToken) {
      setCases(current =>
        current.map(row =>
          row.id === selected.id ? { ...row, status: target, nextAction } : row
        )
      );
      return;
    }

    setApiStatus("saving");
    setApiMessage(`${caseStatusLabel(target)} 단계로 저장 중...`);

    try {
      applySnapshotAfterSave(
        await advanceCaseStatusMvp(adminToken, selected.id, target)
      );
      setApiMessage(`${caseStatusLabel(target)} 단계로 저장되었습니다.`);
    } catch (error) {
      setApiStatus("error");
      setApiMessage(
        "상태 변경 실패: 이메일 인증, Vercel 환경변수, Supabase 권한 설정을 확인하세요."
      );
    }
  }

  function assignProvider(providerId: string) {
    if (!selected) return;
    setCases(current =>
      current.map(row =>
        row.id === selected.id
          ? { ...row, matchedProviderId: providerId, status: "quote_requested" }
          : row
      )
    );
  }

  async function assignPartner(partnerId: string) {
    if (!selected) return;
    setCases(current =>
      current.map(row =>
        row.id === selected.id
          ? {
              ...row,
              assignedPartnerId: partnerId || undefined,
              partnerAssistanceMode:
                row.partnerAssistanceMode === "platform_direct"
                  ? "partner_requested"
                  : row.partnerAssistanceMode,
              nextAction: partnerId
                ? "Partner assigned; review provider shortlist"
                : "Assign partner for requested services",
            }
          : row
      )
    );
    if (!adminToken) return;
    setApiStatus("saving");
    try {
      applySnapshotAfterSave(
        await assignPartnerMvp(adminToken, selected.id, partnerId)
      );
    } catch (error) {
      setApiStatus("error");
      setApiMessage("파트너 배정 실패: 저장 권한 또는 연결 설정을 확인하세요.");
    }
  }

  async function togglePartnerShortlist(providerId: string) {
    if (!selected) return;
    const existing = selected.partnerShortlistedProviderIds ?? [];
    const nextShortlist = existing.includes(providerId)
      ? existing.filter(id => id !== providerId)
      : [...existing, providerId];
    setCases(current =>
      current.map(row => {
        if (row.id !== selected.id) return row;
        return {
          ...row,
          partnerShortlistedProviderIds: nextShortlist,
          nextAction: nextShortlist.length
            ? "Coordinator to request quotes from partner shortlist"
            : "Partner should select provider candidates",
        };
      })
    );
    if (!adminToken || !selected.assignedPartnerId) return;
    setApiStatus("saving");
    try {
      applySnapshotAfterSave(
        await setPartnerShortlistMvp(
          adminToken,
          selected.id,
          selected.assignedPartnerId,
          nextShortlist
        )
      );
    } catch (error) {
      setApiStatus("error");
      setApiMessage(
        "병원 후보 저장 실패: 저장 권한 또는 연결 설정을 확인하세요."
      );
    }
  }

  async function requestQuotesFromShortlist() {
    if (!selected) return;
    const shortlist = selected.partnerShortlistedProviderIds ?? [];
    if (!shortlist.length) return;
    setCases(current =>
      current.map(row =>
        row.id === selected.id
          ? {
              ...row,
              status: "quote_requested",
              matchedProviderId: row.matchedProviderId ?? shortlist[0],
              quoteRequestedProviderIds: Array.from(
                new Set([
                  ...(row.quoteRequestedProviderIds ?? []),
                  ...shortlist,
                ])
              ),
              nextAction: "Provider quote SLA check",
              nextActionAt: new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),
            }
          : row
      )
    );
    if (!adminToken || !selected.assignedPartnerId) return;
    setApiStatus("saving");
    try {
      applySnapshotAfterSave(
        await requestPartnerQuoteMvp(
          adminToken,
          selected.id,
          selected.assignedPartnerId,
          shortlist
        )
      );
    } catch (error) {
      setApiStatus("error");
      setApiMessage("견적 요청 실패: 저장 권한 또는 연결 설정을 확인하세요.");
    }
  }

  const counts = statusOrder.map(status => ({
    status,
    count: cases.filter(row => row.status === status).length,
  }));
  const partnerRequestedCount = cases.filter(
    row =>
      row.partnerAssistanceMode &&
      row.partnerAssistanceMode !== "platform_direct"
  ).length;
  const partnerAssignedCount = cases.filter(
    row => row.assignedPartnerId
  ).length;

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-white">
        <div className="container-wide py-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ClipboardList className="size-4" />
                코디네이터 케이스 관리
              </div>
              <h1 className="font-serif text-5xl text-ink-950">
                운영 케이스 보드
              </h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                상담 적격성 확인, 파트너 배정, 병원 후보 선택, 견적 응답 기준,
                예약금 후속조치, 예약 확정을 한 화면에서 관리합니다.
              </p>
            </div>
            <div className="grid gap-3 sm:min-w-[360px]">
              <div className="rounded-md border border-ink-200 bg-ink-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-ink-500">
                  <Database className="size-3.5" />
                  운영 데이터
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={cn(
                      "text-xs font-semibold",
                      apiStatus === "error"
                        ? "text-coral-700"
                        : liveMode
                          ? "text-teal-700"
                          : "text-ink-500"
                    )}
                  >
                    {apiMessage}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void refreshOps()}
                    disabled={!adminToken || apiStatus === "loading"}
                    className="border-ink-300 text-ink-800"
                  >
                    새로고침
                  </Button>
                </div>
                <div
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    apiStatus === "error"
                      ? "text-coral-700"
                      : liveMode
                        ? "text-teal-700"
                        : "text-ink-500"
                  )}
                >
                  이메일 인증 세션으로 서버 API에 연결합니다.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/partner/cases">
                  <Button
                    variant="outline"
                    className="border-ink-300 text-ink-800"
                  >
                    파트너 화면
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/admin/quote-booking">
                  <Button className="bg-teal-700 text-white hover:bg-teal-800">
                    견적/예약금/예약
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/provider/quotes">
                  <Button
                    variant="outline"
                    className="border-ink-300 text-ink-800"
                  >
                    병원 견적
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-6">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-left">
              <div className="font-serif text-2xl text-ink-950">
                {partnerRequestedCount}
              </div>
              <div className="text-xs font-semibold text-teal-700">
                파트너 요청
              </div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-white p-3 text-left">
              <div className="font-serif text-2xl text-ink-950">
                {partnerAssignedCount}
              </div>
              <div className="text-xs font-semibold text-ink-500">
                파트너 배정
              </div>
            </div>
            {counts
              .filter(
                item => item.count > 0 || visibleStatuses.includes(item.status)
              )
              .slice(0, 6)
              .map(item => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => setStatusFilter(item.status)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    statusFilter === item.status
                      ? "border-teal-300 bg-teal-50"
                      : "border-ink-200 bg-ink-50 hover:bg-white"
                  )}
                >
                  <div className="font-serif text-2xl text-ink-950">
                    {item.count}
                  </div>
                  <div className="text-xs font-semibold text-ink-500">
                    {caseStatusLabel(item.status)}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-50 py-6">
        <div className="container-wide grid gap-6">
          <div className="sticky top-16 z-30 flex max-h-[42vh] min-h-[260px] flex-col overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 font-semibold text-ink-950">
                <Filter className="size-4 text-teal-700" />
                케이스 목록
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={event =>
                    setStatusFilter(
                      event.target.value as BetaCaseStatus | "all"
                    )
                  }
                  className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="all">전체 상태</option>
                  {statusOrder.map(status => (
                    <option key={status} value={status}>
                      {caseStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <select
                  value={ownerFilter}
                  onChange={event => setOwnerFilter(event.target.value)}
                  className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="all">전체 담당자</option>
                  {owners.map(owner => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                <div className="min-w-[920px]">
                  <div className="sticky top-0 z-10 grid gap-4 border-b border-ink-100 bg-ink-50 px-4 py-3 text-xs font-bold uppercase text-ink-500 md:grid-cols-[1.05fr_0.75fr_0.8fr_0.7fr_0.9fr]">
                    <div>케이스</div>
                    <div>요청 내용</div>
                    <div>병원 / 유입</div>
                    <div>예산 / 일정</div>
                    <div>응답 기준 / 다음 작업</div>
                  </div>
                  {filtered.map(row => (
                    <CaseRow
                      key={row.id}
                      row={row}
                      selected={selected?.id === row.id}
                      onSelect={() => setSelectedId(row.id)}
                      providersById={providersById}
                      partnersById={partnersById}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {selected && (
            <section className="overflow-hidden rounded-lg border border-ink-200 bg-white">
              <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-5">
                <div>
                  <div className="text-xs font-bold uppercase text-teal-700">
                    {selected.id}
                  </div>
                  <h2 className="mt-1 font-serif text-3xl text-ink-950">
                    {selected.patientAlias}
                  </h2>
                </div>
                <StatusPill status={selected.status} />
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="grid content-start gap-5">
                  <div className="rounded-md border border-teal-200 bg-teal-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-900">
                      <Handshake className="size-4" />
                      파트너 서비스 요청
                    </div>
                    <div className="grid gap-2 text-sm text-ink-700">
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-500">요청 방식</span>
                        <span className="font-semibold text-ink-950">
                          {partnerModeLabel(selected.partnerAssistanceMode)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-500">공유 동의</span>
                        <span
                          className={cn(
                            "font-semibold",
                            selected.partnerShareConsent
                              ? "text-teal-700"
                              : "text-coral-700"
                          )}
                        >
                          {selected.partnerShareConsent
                            ? "동의 완료"
                            : "동의 필요"}
                        </span>
                      </div>
                      <div>
                        <div className="mb-1 text-ink-500">요청 서비스</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(selected.requestedPartnerServices?.length
                            ? selected.requestedPartnerServices
                            : ["none"]
                          ).map(service => (
                            <span
                              key={service}
                              className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink-700"
                            >
                              {partnerServiceLabel(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <label className="mt-2 grid gap-1.5 font-medium text-ink-800">
                        파트너 배정
                        <select
                          value={selected.assignedPartnerId ?? ""}
                          onChange={event => assignPartner(event.target.value)}
                          className="h-11 rounded-md border border-teal-200 bg-white px-3 text-sm text-ink-900"
                        >
                          <option value="">미배정</option>
                          {partners
                            .filter(partner => partner.active)
                            .map(partner => (
                              <option key={partner.id} value={partner.id}>
                                {partner.name} /{" "}
                                {partnerTypeLabel(partner.type)}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                    {liveMode && !selected.assignedPartnerId && (
                      <div className="mt-3 rounded-md border border-coral-200 bg-coral-50 p-3 text-xs font-semibold text-coral-800">
                        Supabase에 병원 후보를 저장하려면 먼저 파트너를 배정해야
                        합니다.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-md bg-ink-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                        <Languages className="size-3.5" />
                        언어 / 시장
                      </div>
                      <div className="font-semibold text-ink-950">
                        {marketLabel(selected.market)} /{" "}
                        {languageLabel(selected.language)} /{" "}
                        {languageLabel(selected.locale)}
                      </div>
                    </div>
                    <div className="rounded-md bg-ink-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                        <CalendarClock className="size-3.5" />
                        방문 희망 일정
                      </div>
                      <div className="font-semibold text-ink-950">
                        {selected.travelStart} ~ {selected.travelEnd}
                      </div>
                    </div>
                    <div className="rounded-md bg-ink-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                        <UserRoundCheck className="size-3.5" />
                        매칭 병원
                      </div>
                      <div className="font-semibold text-ink-950">
                        {selectedProvider?.name ?? "미매칭"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-coral-200 bg-coral-50 p-4">
                    <div className="text-sm font-semibold text-coral-900">
                      다음 작업
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-700">
                      {nextActionLabel(selected.nextAction)}
                    </p>
                    <div className="mt-2 text-xs font-semibold text-coral-800">
                      {selected.nextActionAt}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      onClick={advanceSelected}
                      className="w-full bg-teal-700 text-white hover:bg-teal-800"
                    >
                      다음 상태로 이동
                    </Button>
                    <select
                      value={selected.matchedProviderId ?? ""}
                      onChange={event => assignProvider(event.target.value)}
                      className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900"
                    >
                      <option value="">병원 배정</option>
                      {providers
                        .filter(provider => provider.active)
                        .map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {selected.riskFlags.length > 0 && (
                    <div className="rounded-md border border-coral-200 p-3 text-sm text-coral-800">
                      위험 플래그:{" "}
                      {selected.riskFlags.map(riskFlagLabel).join(", ")}
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-5">
                  <div className="rounded-md border border-ink-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                      <Building2 className="size-4 text-teal-700" />
                      파트너 병원 후보
                    </div>
                    <div className="grid gap-2">
                      {providers
                        .filter(provider => provider.active)
                        .map(provider => {
                          const selectedForShortlist = Boolean(
                            selected.partnerShortlistedProviderIds?.includes(
                              provider.id
                            )
                          );
                          const requested = Boolean(
                            selected.quoteRequestedProviderIds?.includes(
                              provider.id
                            )
                          );
                          return (
                            <button
                              key={provider.id}
                              type="button"
                              onClick={() =>
                                togglePartnerShortlist(provider.id)
                              }
                              className={cn(
                                "rounded-md border p-3 text-left text-sm transition-colors",
                                selectedForShortlist
                                  ? "border-teal-300 bg-teal-50"
                                  : "border-ink-200 bg-ink-50 hover:bg-white"
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-ink-950">
                                  {provider.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs font-bold",
                                    requested ? "text-teal-700" : "text-ink-400"
                                  )}
                                >
                                  {requested
                                    ? "견적 요청됨"
                                    : `적합도 ${provider.betaScore}`}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-ink-500">
                                {languageListLabel(provider.languages)} / 응답{" "}
                                {provider.slaHours}시간
                              </div>
                            </button>
                          );
                        })}
                    </div>
                    <Button
                      onClick={requestQuotesFromShortlist}
                      disabled={!selected.partnerShortlistedProviderIds?.length}
                      className="mt-3 w-full bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300"
                    >
                      <Send className="size-4" />
                      코디네이터 견적 요청
                    </Button>
                  </div>

                  <div className="rounded-md border border-ink-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                      <Send className="size-4 text-teal-700" />
                      병원 견적 응답
                    </div>
                    <div className="grid gap-2">
                      {selectedQuoteRequests.length ? (
                        selectedQuoteRequests.map(request => (
                          <div
                            key={request.id}
                            className="rounded-md border border-ink-200 bg-ink-50 p-3 text-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-ink-950">
                                  {request.providerName}
                                </div>
                                <div className="mt-1 text-xs text-ink-500">
                                  {statusLabel(request.status)} / 기한{" "}
                                  {request.dueAt ?? "미설정"}
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 justify-center whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold",
                                  request.quote
                                    ? "border-teal-200 bg-teal-50 text-teal-800"
                                    : "border-coral-200 bg-coral-50 text-coral-800"
                                )}
                              >
                                {request.quote ? "응답 완료" : "응답 대기"}
                              </span>
                            </div>
                            {request.quote && (
                              <div className="mt-2 text-xs font-semibold text-teal-800">
                                견적{" "}
                                {formatUsd(
                                  request.quote.medicalFeeUsd +
                                    request.quote.nonmedicalFeeUsd
                                )}{" "}
                                / 예약금{" "}
                                {formatUsd(request.quote.depositAmountUsd)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-500">
                          아직 이 케이스에 병원 견적 요청이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-ink-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                      <Activity className="size-4 text-teal-700" />
                      케이스 활동 기록
                    </div>
                    <div className="grid gap-2">
                      {selectedActivities.length ? (
                        selectedActivities.map(event => (
                          <div
                            key={event.id}
                            className="rounded-md bg-ink-50 p-3 text-sm"
                          >
                            <div className="font-semibold text-ink-950">
                              {eventLabel(event.eventType)}
                            </div>
                            <div className="mt-1 text-xs text-ink-500">
                              {event.actorLabel ?? actorLabel(event.actorRole)}{" "}
                              /{" "}
                              {event.createdAt?.slice(0, 16).replace("T", " ")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-500">
                          아직 활동 기록이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </Layout>
  );
}
