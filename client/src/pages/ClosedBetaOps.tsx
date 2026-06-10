import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Download,
  Gauge,
  LineChart,
  Scale,
  ShieldCheck,
  Target,
  WalletCards,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  betaCases,
  betaDepositBookings,
  betaLedger,
  betaProviders,
  betaTargets,
  channelRankings,
  formatPercent,
  formatUsd,
  leadTestSegments,
  ledgerNet,
  providerDepositRate,
  providerQuoteRate,
} from "@/lib/betaData";
import { languageListLabel, providerNextStepLabel, statusLabel } from "@/lib/adminLabels";
import { cn } from "@/lib/utils";

function StatusPill({ value }: { value: string }) {
  const style =
    value === "signed" || value === "paid" || value === "increase" || value === "reconciled"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : value === "pending_docs" || value === "reduce" || value === "unreconciled"
        ? "border-coral-200 bg-coral-50 text-coral-800"
        : "border-ink-200 bg-ink-50 text-ink-700";

  return <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", style)}>{statusLabel(value)}</span>;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  target,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  target?: string | number;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-md bg-teal-50 text-teal-700">
          <Icon className="size-5" />
        </div>
        {target !== undefined && <span className="text-xs font-semibold text-ink-500">목표 {target}</span>}
      </div>
      <div className="font-serif text-3xl text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{label}</div>
    </div>
  );
}

export default function ClosedBetaOps() {
  const totalLeads = leadTestSegments.reduce((sum, row) => sum + row.currentLeads, 0);
  const qualifiedCases = betaCases.filter((row) => row.status !== "new" && row.status !== "closed_lost").length;
  const quoteRequests = betaCases.filter((row) =>
    ["quote_requested", "quote_sent", "deposit_pending", "deposit_paid", "booking_confirmed"].includes(row.status),
  ).length;
  const quotesSent = betaCases.filter((row) => ["quote_sent", "deposit_pending", "deposit_paid", "booking_confirmed"].includes(row.status)).length;
  const depositsPaid = betaDepositBookings.filter((row) => row.depositStatus === "paid").length;
  const reconciledRows = betaLedger.filter((row) => row.settlementStatus === "reconciled").length;
  const signedProviders = betaProviders.filter((provider) => provider.slaStatus === "signed").length;

  const providerRanking = [...betaProviders].sort((a, b) => {
    const scoreA = providerDepositRate(a) * 30 + providerQuoteRate(a) * 20 + a.betaScore * 0.5 - a.slaBreaches * 10 - a.complaints * 20;
    const scoreB = providerDepositRate(b) * 30 + providerQuoteRate(b) * 20 + b.betaScore * 0.5 - b.slaBreaches * 10 - b.complaints * 20;
    return scoreB - scoreA;
  });

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ShieldCheck className="size-4" />
                비공개 베타 운영센터
              </div>
              <h1 className="font-serif text-5xl text-ink-950">일본/대만 피부 패키지 베타 운영</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-600">
                5개 병원 응답 기준, 300개 리드 테스트, 예약금 15건 목표, 정산 장부, 병원/채널 예산 판단을 한 화면에서 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/beta/closed-beta-master-sheet.xlsx" download>
                <Button className="bg-teal-700 text-white hover:bg-teal-800">
                  <Download className="size-4" />
                  운영 시트
                </Button>
              </a>
              <Link href="/admin/cases">
                <Button variant="outline" className="border-ink-300 text-ink-800">
                  케이스 보드
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/admin/landing-routes">
                <Button variant="outline" className="border-ink-300 text-ink-800">
                  랜딩 경로
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={Target} label="수집 리드" value={totalLeads} target={betaTargets.leads} />
            <MetricCard icon={ClipboardCheck} label="상담 가능 케이스" value={qualifiedCases} target={betaTargets.qualifiedCases} />
            <MetricCard icon={WalletCards} label="견적 요청" value={quoteRequests} target={betaTargets.quoteRequests} />
            <MetricCard icon={Scale} label="예약금 결제" value={depositsPaid} target={betaTargets.depositsPaid} />
            <MetricCard icon={Building2} label="응답 기준 계약 병원" value={signedProviders} target={5} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl text-ink-950">핵심 병원 응답 기준 추적</h2>
                <p className="mt-1 text-sm text-ink-500">응답 기준 계약과 필수 서류 검증이 완료되기 전까지는 후보 병원으로 관리합니다.</p>
              </div>
              <span className="rounded-md bg-ink-950 px-3 py-1.5 text-sm font-semibold text-white">{signedProviders}/5 계약 완료</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">병원</th>
                    <th className="px-4 py-3">서류</th>
                    <th className="px-4 py-3">응답 기준</th>
                    <th className="px-4 py-3">점수</th>
                    <th className="px-4 py-3">다음 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {betaProviders.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.name}</div>
                        <div className="text-xs text-ink-500">
                          {provider.region} / {languageListLabel(provider.languages)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <StatusPill value={provider.registrationVerified ? "registration" : "registration_pending"} />
                          <StatusPill value={provider.insuranceVerified ? "insurance" : "pending_docs"} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={provider.slaStatus} />
                        <div className="mt-1 text-xs text-ink-500">견적 응답 {provider.slaHours}시간</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.betaScore}</div>
                        <div className="text-xs text-ink-500">{provider.active ? "배정 가능" : "배정 중지"}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{providerNextStepLabel(provider.nextStep)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">정산 검증</h2>
            </div>
            <div className="grid gap-3">
              {betaLedger.map((row) => (
                <div key={row.id} className="rounded-md border border-ink-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink-950">{row.id}</div>
                      <div className="text-xs text-ink-500">{row.caseId} / {row.providerId}</div>
                    </div>
                    <StatusPill value={row.settlementStatus} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-ink-500">수수료</div>
                      <div className="font-semibold text-ink-950">{formatUsd(row.commissionAmountUsd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">플랫폼 순액</div>
                      <div className="font-semibold text-ink-950">{formatUsd(ledgerNet(row))}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                결제된 정산 행 {betaLedger.length}건 중 {reconciledRows}건이 확인되었습니다. 결제 케이스는 견적, 예약, 결제, 병원, 수수료 상한이 모두 연결되어야 합니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-ink-50">
        <div className="container-wide">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-3xl text-ink-950">300개 리드 테스트 계획</h2>
              <p className="mt-1 text-sm text-ink-500">현재 값은 시드/테스트 데이터입니다. 실제 캠페인이 시작되면 실제 수치로 갱신됩니다.</p>
            </div>
            <Link href="/admin/quote-booking">
              <Button className="bg-ink-950 text-white hover:bg-ink-800">견적 예약 화면 열기</Button>
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {leadTestSegments.map((segment) => {
              const progress = Math.min(100, Math.round((segment.currentLeads / segment.targetLeads) * 100));
              return (
                <div key={segment.segment} className="rounded-lg border border-ink-200 bg-white p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink-950">{segment.segment}</h3>
                      <div className="mt-1 text-xs text-ink-500">{segment.primaryRoute}</div>
                    </div>
                    <StatusPill value={segment.status} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-950">{segment.currentLeads}/{segment.targetLeads} 리드</span>
                    <span className="text-ink-500">예약금 목표 {formatPercent(segment.targetDepositRate)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center gap-2">
              <LineChart className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">병원 전환 순위</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">순위</th>
                    <th className="px-4 py-3">병원</th>
                    <th className="px-4 py-3">견적</th>
                    <th className="px-4 py-3">예약금</th>
                    <th className="px-4 py-3">조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {providerRanking.map((provider, index) => (
                    <tr key={provider.id}>
                      <td className="px-4 py-3 font-serif text-xl text-ink-950">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.name}</div>
                        <div className="text-xs text-ink-500">응답 지연 {provider.slaBreaches}건</div>
                      </td>
                      <td className="px-4 py-3">{formatPercent(providerQuoteRate(provider))}</td>
                      <td className="px-4 py-3">{formatPercent(providerDepositRate(provider))}</td>
                      <td className="px-4 py-3">
                        <StatusPill value={index === 0 && provider.active ? "increase" : provider.active ? "hold" : "stop"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-2">
              <Target className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">채널 예산 판단</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">캠페인</th>
                    <th className="px-4 py-3">리드 획득비</th>
                    <th className="px-4 py-3">예약금</th>
                    <th className="px-4 py-3">수익</th>
                    <th className="px-4 py-3">예산</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {channelRankings.map((channel) => (
                    <tr key={`${channel.source}-${channel.campaign}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{channel.campaign}</div>
                        <div className="text-xs text-ink-500">{channel.source}</div>
                      </td>
                      <td className="px-4 py-3">{formatUsd(channel.cacUsd)}</td>
                      <td className="px-4 py-3">{formatPercent(channel.depositRate)}</td>
                      <td className="px-4 py-3">{formatUsd(channel.contributionProfitUsd)}</td>
                      <td className="px-4 py-3">
                        <StatusPill value={channel.budgetAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
