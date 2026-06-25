import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Building2, CircleDollarSign, Clock3, Database, Send, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { betaCases, betaProviders, formatUsd } from "@/lib/betaData";
import {
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  submitProviderQuoteMvp,
  type ProviderQuoteRequest,
} from "@/lib/partnerMvpApi";
import { languageLabel, marketLabel, statusLabel } from "@/lib/adminLabels";
import { cn } from "@/lib/utils";

function demoProviderQuoteRequests(): ProviderQuoteRequest[] {
  return betaCases.flatMap((row) => {
    const providerIds = row.quoteRequestedProviderIds?.length ? row.quoteRequestedProviderIds : row.status === "quote_requested" && row.matchedProviderId ? [row.matchedProviderId] : [];
    return providerIds.map((providerId, index) => {
      const provider = betaProviders.find((item) => item.id === providerId);
      return {
        id: `demo-qr-${row.id}-${providerId}`,
        caseId: row.id,
        providerId,
        providerName: provider?.name ?? "병원",
        patientAlias: row.patientAlias,
        procedure: row.procedure,
        market: row.market,
        language: row.language,
        budgetMinUsd: row.budgetMinUsd,
        budgetMaxUsd: row.budgetMaxUsd,
        travelStart: row.travelStart,
        travelEnd: row.travelEnd,
        status: index === 0 && row.status === "quote_sent" ? "responded" : "requested",
        dueAt: row.nextActionAt,
        requestedAt: row.nextActionAt,
        notes: "파트너 추천 후보에서 견적 요청됨.",
        caseStatus: row.status,
        quote: null,
      };
    });
  });
}

function StatusPill({ value }: { value: string }) {
  const ok = value === "responded" || value === "sent";
  const warn = value === "requested" || value === "draft";
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        ok && "border-teal-200 bg-teal-50 text-teal-800",
        warn && "border-coral-200 bg-coral-50 text-coral-800",
        !ok && !warn && "border-ink-200 bg-ink-50 text-ink-700",
      )}
    >
      {statusLabel(value)}
    </span>
  );
}

export default function ProviderQuoteDesk() {
  const [providers, setProviders] = useState(betaProviders);
  const [quoteRequests, setQuoteRequests] = useState<ProviderQuoteRequest[]>(demoProviderQuoteRequests());
  const [providerId, setProviderId] = useState(betaProviders[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState(quoteRequests[0]?.id ?? "");
  const [adminToken] = useState(() => readAdminApiToken());
  const [apiStatus, setApiStatus] = useState<"demo" | "loading" | "live" | "saving" | "error">(adminToken ? "loading" : "demo");
  const [apiMessage, setApiMessage] = useState(adminToken ? "Supabase 운영 데이터에 연결 중..." : "데모 견적 화면");

  const visibleRequests = useMemo(() => quoteRequests.filter((row) => row.providerId === providerId), [providerId, quoteRequests]);
  const selected = visibleRequests.find((row) => row.id === selectedId) ?? visibleRequests[0];
  const selectedProvider = providers.find((row) => row.id === providerId) ?? providers[0];
  const liveMode = Boolean(adminToken && apiStatus !== "demo");

  const [medicalFee, setMedicalFee] = useState(980);
  const [nonmedicalFee, setNonmedicalFee] = useState(80);
  const [commissionRate, setCommissionRate] = useState(0.15);
  const [depositAmount, setDepositAmount] = useState(150);
  const [validUntil, setValidUntil] = useState("2026-07-01");
  const [notes, setNotes] = useState("최종 시술 계획과 금액은 병원 상담 후 변경될 수 있습니다.");

  function applySnapshot(snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>) {
    if (snapshot.providers.length) {
      setProviders(snapshot.providers);
      setProviderId((current) => (snapshot.providers.some((item) => item.id === current) ? current : snapshot.providers[0]?.id ?? ""));
    }
    setQuoteRequests(snapshot.providerQuoteRequests ?? []);
    setSelectedId((current) => (snapshot.providerQuoteRequests?.some((item) => item.id === current) ? current : snapshot.providerQuoteRequests?.[0]?.id ?? ""));
    setApiStatus("live");
    setApiMessage(`Supabase 견적 화면 연결됨: 견적 요청 ${snapshot.meta?.quoteRequestCount ?? snapshot.providerQuoteRequests?.length ?? 0}건`);
  }

  async function refreshOps(token = adminToken) {
    if (!token) return;
    setApiStatus("loading");
    setApiMessage("병원 견적 요청을 불러오는 중...");
    try {
      applySnapshot(await fetchPartnerMvpSnapshot(token));
    } catch (error) {
      setApiStatus("error");
      setApiMessage("견적 화면 로드 실패: 연결 설정을 확인하세요.");
    }
  }

  useEffect(() => {
    if (adminToken) void refreshOps(adminToken);
  }, [adminToken]);

  useEffect(() => {
    if (visibleRequests.length && !visibleRequests.some((row) => row.id === selectedId)) {
      setSelectedId(visibleRequests[0].id);
    }
  }, [selectedId, visibleRequests]);

  useEffect(() => {
    if (!selected?.quote) return;
    setMedicalFee(selected.quote.medicalFeeUsd);
    setNonmedicalFee(selected.quote.nonmedicalFeeUsd);
    setCommissionRate(selected.quote.commissionRate);
    setDepositAmount(selected.quote.depositAmountUsd);
    setValidUntil(selected.quote.validUntil?.slice(0, 10) ?? "2026-07-01");
    setNotes(selected.quote.notes);
  }, [selected?.id]);

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const quote = {
      id: selected.quote?.id ?? `demo-quote-${selected.id}`,
      quoteRequestId: selected.id,
      caseId: selected.caseId,
      providerId: selected.providerId,
      medicalFeeUsd: medicalFee,
      nonmedicalFeeUsd: nonmedicalFee,
      commissionRate,
      capRate: 0.3,
      depositAmountUsd: depositAmount,
      currency: "USD",
      validUntil,
      status: "sent",
      sentAt: new Date().toISOString(),
      notes,
      createdAt: new Date().toISOString(),
    };

    setQuoteRequests((current) => current.map((row) => (row.id === selected.id ? { ...row, status: "responded", quote } : row)));

    if (!adminToken) return;
    setApiStatus("saving");
    try {
      applySnapshot(
        await submitProviderQuoteMvp(adminToken, {
          quoteRequestId: selected.id,
          caseId: selected.caseId,
          providerId: selected.providerId,
          medicalFee,
          nonmedicalFee,
          currency: "USD",
          commissionRate,
          depositAmount,
          validUntil,
          notes,
        }),
      );
      setApiMessage("병원 견적이 Supabase에 저장되었습니다");
    } catch (error) {
      setApiStatus("error");
      setApiMessage("병원 견적 저장 실패: 저장 권한 또는 연결 설정을 확인하세요.");
    }
  }

  const requestedCount = quoteRequests.filter((row) => row.status === "requested").length;
  const respondedCount = quoteRequests.filter((row) => row.status === "responded" || row.quote).length;

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-8">
          <Link href="/admin/cases" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="size-4" />
            코디네이터 보드
          </Link>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Building2 className="size-4" />
                병원 견적 업무
              </div>
              <h1 className="font-serif text-5xl text-ink-950">병원 견적 데스크</h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                코디네이터가 견적을 요청한 파트너 연계 케이스에 병원이 견적을 제출하는 화면입니다.
              </p>
            </div>
            <div className="grid gap-3 sm:min-w-[360px]">
              <div className="rounded-md border border-ink-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-ink-500">
                  <Database className="size-3.5" />
                  운영 데이터
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className={cn("text-xs font-semibold", apiStatus === "error" ? "text-coral-700" : liveMode ? "text-teal-700" : "text-ink-500")}>
                    {apiMessage}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => void refreshOps()} disabled={!adminToken || apiStatus === "loading"} className="border-ink-300 text-ink-800">
                    새로고침
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-coral-200 bg-coral-50 p-4">
              <Clock3 className="mb-3 size-5 text-coral-700" />
              <div className="font-serif text-2xl text-ink-950">{requestedCount}</div>
              <div className="text-sm text-coral-800">대기 중인 견적 요청</div>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <ShieldCheck className="mb-3 size-5 text-teal-700" />
              <div className="font-serif text-2xl text-ink-950">{respondedCount}</div>
              <div className="text-sm text-teal-800">병원 응답 완료</div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-white p-4 md:col-span-2">
              <div className="text-xs font-semibold uppercase text-ink-500">선택 병원</div>
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900"
              >
                {providers.filter((provider) => provider.active).map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-6 xl:grid-cols-[1fr_430px]">
          <div className="overflow-hidden rounded-lg border border-ink-200">
            <div className="border-b border-ink-100 bg-ink-50 p-4">
              <div className="font-semibold text-ink-950">견적 요청 목록</div>
              <p className="mt-1 text-sm text-ink-500">{selectedProvider?.name ?? "병원"}에 배정된 견적 요청만 표시됩니다.</p>
            </div>
            {visibleRequests.length ? (
              visibleRequests.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={cn(
                    "grid w-full gap-4 border-b border-ink-100 p-4 text-left transition-colors md:grid-cols-[1fr_0.9fr_0.75fr_0.6fr]",
                    selected?.id === row.id ? "bg-teal-50/70" : "bg-white hover:bg-ink-50",
                  )}
                >
                  <div>
                    <div className="font-semibold text-ink-950">{row.patientAlias}</div>
                    <div className="mt-1 text-xs text-ink-500">{row.caseId.slice(0, 8)} / {row.procedure}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{marketLabel(row.market)} / {languageLabel(row.language)}</div>
                    <div className="mt-1 text-xs text-ink-500">{row.travelStart} ~ {row.travelEnd}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{formatUsd(row.budgetMinUsd)} - {formatUsd(row.budgetMaxUsd)}</div>
                    <div className="mt-1 text-xs text-ink-500">{row.dueAt ?? "기한 미설정"}</div>
                  </div>
                  <div className="flex items-start justify-end">
                    <StatusPill value={row.quote ? "responded" : row.status} />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-ink-500">이 병원에 배정된 견적 요청이 없습니다.</div>
            )}
          </div>

          <aside className="rounded-lg border border-ink-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase text-teal-700">{selected?.caseId.slice(0, 8) ?? "견적 요청 없음"}</div>
              <h2 className="mt-1 font-serif text-3xl text-ink-950">{selected?.providerName ?? "견적 응답"}</h2>
              {selected && <p className="mt-2 text-sm leading-6 text-ink-500">{selected.procedure} / {selected.patientAlias}</p>}
            </div>

            <form onSubmit={submitQuote} className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  의료비
                  <input value={medicalFee} onChange={(event) => setMedicalFee(Number(event.target.value))} type="number" min="0" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  비의료비
                  <input value={nonmedicalFee} onChange={(event) => setNonmedicalFee(Number(event.target.value))} type="number" min="0" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  수수료율
                  <input value={commissionRate} onChange={(event) => setCommissionRate(Number(event.target.value))} type="number" min="0" max="0.3" step="0.01" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  예약금
                  <input value={depositAmount} onChange={(event) => setDepositAmount(Number(event.target.value))} type="number" min="0" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                견적 유효일
                <input value={validUntil} onChange={(event) => setValidUntil(event.target.value)} type="date" className="h-11 rounded-md border border-ink-200 px-3" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                병원 메모
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="rounded-md border border-ink-200 px-3 py-2" />
              </label>
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
                <div className="flex items-center gap-2 font-semibold">
                  <CircleDollarSign className="size-4" />
                  총 견적 {formatUsd(medicalFee + nonmedicalFee)}
                </div>
                <div className="mt-1">예약금 {formatUsd(depositAmount)} / 수수료율 {(commissionRate * 100).toFixed(0)}%</div>
              </div>
              <Button type="submit" disabled={!selected || apiStatus === "saving"} className="bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300">
                <Send className="size-4" />
                견적 제출
              </Button>
            </form>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
