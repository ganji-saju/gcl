import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Building2, Database, Handshake, Languages, Send } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { betaCases, betaPartners, betaProviders, formatUsd, type BetaCase } from "@/lib/betaData";
import { fetchPartnerMvpSnapshot, readAdminApiToken, setPartnerShortlistMvp } from "@/lib/partnerMvpApi";
import { languageLabel, languageListLabel, marketLabel, partnerServiceLabel, statusLabel } from "@/lib/adminLabels";
import { cn } from "@/lib/utils";

function serviceLabel(value: string) {
  return partnerServiceLabel(value);
}

function PartnerCaseRow({ row, selected, onSelect }: { row: BetaCase; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-4 border-b border-ink-100 p-4 text-left transition-colors md:grid-cols-[1fr_0.8fr_0.8fr]",
        selected ? "bg-teal-50/70" : "bg-white hover:bg-ink-50",
      )}
    >
      <div>
        <div className="font-semibold text-ink-950">{row.patientAlias}</div>
        <div className="mt-1 text-xs text-ink-500">{row.id} / {row.packageId}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{row.procedure}</div>
        <div className="mt-1 text-xs text-ink-500">{marketLabel(row.market)} / {languageLabel(row.language)}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{formatUsd(row.budgetMinUsd)} - {formatUsd(row.budgetMaxUsd)}</div>
        <div className="mt-1 text-xs text-ink-500">{row.travelStart} ~ {row.travelEnd}</div>
      </div>
    </button>
  );
}

export default function PartnerCaseBoard() {
  const [cases, setCases] = useState(betaCases);
  const [partners, setPartners] = useState(betaPartners);
  const [providers, setProviders] = useState(betaProviders);
  const [partnerId, setPartnerId] = useState(betaPartners[0]?.id ?? "");
  const [adminToken] = useState(() => readAdminApiToken());
  const [apiStatus, setApiStatus] = useState<"demo" | "loading" | "live" | "saving" | "error">(adminToken ? "loading" : "demo");
  const [apiMessage, setApiMessage] = useState(adminToken ? "Supabase 운영 데이터에 연결 중..." : "데모 보드");
  const partner = partners.find((item) => item.id === partnerId) ?? partners[0];
  const visibleCases = useMemo(() => cases.filter((row) => row.assignedPartnerId === partner?.id), [cases, partner?.id]);
  const [selectedId, setSelectedId] = useState(visibleCases[0]?.id ?? "");
  const selected = visibleCases.find((row) => row.id === selectedId) ?? visibleCases[0];
  const liveMode = Boolean(adminToken && apiStatus !== "demo");

  function applySnapshot(snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>) {
    if (snapshot.cases.length) setCases(snapshot.cases);
    if (snapshot.partners.length) {
      setPartners(snapshot.partners);
      setPartnerId((current) => (snapshot.partners.some((item) => item.id === current) ? current : snapshot.partners[0]?.id ?? ""));
    }
    if (snapshot.providers.length) setProviders(snapshot.providers);
    setApiStatus("live");
    setApiMessage(`Supabase 운영 연결됨: 파트너 요청 ${snapshot.meta?.partnerRequestCount ?? snapshot.cases.length}건`);
  }

  async function refreshOps(token = adminToken) {
    if (!token) return;
    setApiStatus("loading");
    setApiMessage("배정된 파트너 케이스를 불러오는 중...");
    try {
      applySnapshot(await fetchPartnerMvpSnapshot(token));
    } catch (error) {
      setApiStatus("error");
      setApiMessage("운영 데이터 로드 실패: 연결 설정을 확인하세요.");
    }
  }

  useEffect(() => {
    if (adminToken) void refreshOps(adminToken);
  }, [adminToken]);

  useEffect(() => {
    if (visibleCases.length && !visibleCases.some((row) => row.id === selectedId)) {
      setSelectedId(visibleCases[0].id);
    }
  }, [visibleCases, selectedId]);

  async function toggleShortlist(providerId: string) {
    if (!selected) return;
    const existing = selected.partnerShortlistedProviderIds ?? [];
    const nextShortlist = existing.includes(providerId) ? existing.filter((id) => id !== providerId) : [...existing, providerId];
    setCases((current) =>
      current.map((row) => {
        if (row.id !== selected.id) return row;
        return {
          ...row,
          partnerShortlistedProviderIds: nextShortlist,
          nextAction: nextShortlist.length ? "Coordinator to request quotes from partner shortlist" : "Partner should select provider candidates",
        };
      }),
    );
    if (!adminToken || !partner?.id) return;
    setApiStatus("saving");
    try {
      applySnapshot(await setPartnerShortlistMvp(adminToken, selected.id, partner.id, nextShortlist));
      setApiMessage("파트너 병원 후보가 저장되었습니다");
    } catch (error) {
      setApiStatus("error");
      setApiMessage("병원 후보 저장 실패: 저장 권한 또는 연결 설정을 확인하세요.");
    }
  }

  const recommendedProviders = providers.filter((provider) => provider.active);

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
                <Handshake className="size-4" />
                파트너용 케이스 화면
              </div>
              <h1 className="font-serif text-5xl text-ink-950">파트너 케이스 보드</h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                배정된 파트너가 공유 동의 범위 안에서 케이스 요약을 확인하고 병원 후보를 선택하는 운영 화면입니다.
              </p>
            </div>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-700">
              파트너 운영자
              <select
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
                className="h-11 min-w-72 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900"
              >
                {partners.filter((item) => item.active).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 max-w-xl rounded-md border border-ink-200 bg-white p-3">
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

          {partner && (
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">검증 상태</div>
                <div className="mt-1 font-serif text-2xl text-ink-950">{statusLabel(partner.verificationStatus)}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">배정 케이스</div>
                <div className="mt-1 font-serif text-2xl text-ink-950">{visibleCases.length}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">지원 언어</div>
                <div className="mt-1 text-sm font-semibold text-ink-950">{languageListLabel(partner.languages)}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">응답 기준</div>
                <div className="mt-1 font-serif text-2xl text-ink-950">{partner.slaHours}h</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-6 xl:grid-cols-[1fr_410px]">
          <div className="overflow-hidden rounded-lg border border-ink-200">
            <div className="border-b border-ink-100 bg-ink-50 p-4">
              <div className="font-semibold text-ink-950">배정된 케이스</div>
              <p className="mt-1 text-sm text-ink-500">최소기능 파트너 화면에서는 의료 문서가 노출되지 않습니다.</p>
            </div>
            {visibleCases.length ? (
              visibleCases.map((row) => (
                <PartnerCaseRow key={row.id} row={row} selected={selected?.id === row.id} onSelect={() => setSelectedId(row.id)} />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-ink-500">이 파트너에게 배정된 케이스가 없습니다.</div>
            )}
          </div>

          {selected && (
            <aside className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-teal-700">{selected.id}</div>
                <h2 className="mt-1 font-serif text-3xl text-ink-950">{selected.patientAlias}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  방문 일정, 언어, 지원 서비스, 병원 후보 선택에 필요한 파트너용 요약입니다.
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                    <Languages className="size-3.5" />
                    언어 / 시장
                  </div>
                  <div className="font-semibold text-ink-950">{marketLabel(selected.market)} / {languageLabel(selected.language)}</div>
                </div>
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="text-xs font-semibold uppercase text-ink-500">요청 서비스</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(selected.requestedPartnerServices?.length ? selected.requestedPartnerServices : ["none"]).map((service) => (
                      <span key={service} className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink-700">
                        {serviceLabel(service)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-ink-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <Building2 className="size-4 text-teal-700" />
                  병원 후보 선택
                </div>
                <div className="grid gap-2">
                  {recommendedProviders.map((provider) => {
                    const selectedForShortlist = Boolean(selected.partnerShortlistedProviderIds?.includes(provider.id));
                    const preferred = Boolean(partner?.preferredProviderIds.includes(provider.id));
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => toggleShortlist(provider.id)}
                        className={cn(
                          "rounded-md border p-3 text-left text-sm transition-colors",
                          selectedForShortlist ? "border-teal-300 bg-teal-50" : "border-ink-200 bg-ink-50 hover:bg-white",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-ink-950">{provider.name}</span>
                          <span className={cn("text-xs font-bold", preferred ? "text-teal-700" : "text-ink-400")}>
                            {preferred ? "우선 후보" : `적합도 ${provider.betaScore}`}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-ink-500">
                          {languageListLabel(provider.languages)} / 응답 {provider.slaHours}시간
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                <div className="flex items-center gap-2 font-semibold">
                  <Send className="size-4" />
                  코디네이터 전달
                </div>
                <p className="mt-2 leading-6">
                  선택한 병원은 파트너 추천 후보로 저장됩니다. 코디네이터가 규정 적합성을 확인한 뒤 병원에 견적을 요청합니다.
                </p>
              </div>
            </aside>
          )}
        </div>
      </section>
    </Layout>
  );
}
