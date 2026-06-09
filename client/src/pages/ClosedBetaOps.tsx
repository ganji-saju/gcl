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
import { cn } from "@/lib/utils";

function StatusPill({ value }: { value: string }) {
  const style =
    value === "signed" || value === "paid" || value === "increase" || value === "reconciled"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : value === "pending_docs" || value === "reduce" || value === "unreconciled"
        ? "border-coral-200 bg-coral-50 text-coral-800"
        : "border-ink-200 bg-ink-50 text-ink-700";

  return <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", style)}>{value.replace("_", " ")}</span>;
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
        {target !== undefined && <span className="text-xs font-semibold text-ink-500">Target {target}</span>}
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
                Closed beta command center
              </div>
              <h1 className="font-serif text-5xl text-ink-950">Japan/Taiwan skin package beta ops</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-600">
                5-provider SLA gate, 300-lead test, 15-deposit target, settlement ledger, and provider/channel budget focus in one operating view.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/beta/closed-beta-master-sheet.xlsx" download>
                <Button className="bg-teal-700 text-white hover:bg-teal-800">
                  <Download className="size-4" />
                  Master Sheet
                </Button>
              </a>
              <Link href="/admin/cases">
                <Button variant="outline" className="border-ink-300 text-ink-800">
                  Case Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={Target} label="Leads captured" value={totalLeads} target={betaTargets.leads} />
            <MetricCard icon={ClipboardCheck} label="Qualified cases" value={qualifiedCases} target={betaTargets.qualifiedCases} />
            <MetricCard icon={WalletCards} label="Quote requests" value={quoteRequests} target={betaTargets.quoteRequests} />
            <MetricCard icon={Scale} label="Deposits paid" value={depositsPaid} target={betaTargets.depositsPaid} />
            <MetricCard icon={Building2} label="Signed provider SLAs" value={signedProviders} target={5} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl text-ink-950">Core provider SLA tracker</h2>
                <p className="mt-1 text-sm text-ink-500">Providers are candidates until signed SLA and document gates are complete.</p>
              </div>
              <span className="rounded-md bg-ink-950 px-3 py-1.5 text-sm font-semibold text-white">{signedProviders}/5 signed</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Docs</th>
                    <th className="px-4 py-3">SLA</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Next step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {betaProviders.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.name}</div>
                        <div className="text-xs text-ink-500">
                          {provider.region} / {provider.languages.join(", ").toUpperCase()}
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
                        <div className="mt-1 text-xs text-ink-500">{provider.slaHours}h quote SLA</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.betaScore}</div>
                        <div className="text-xs text-ink-500">{provider.active ? "assignable" : "blocked"}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{provider.nextStep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">Ledger validation</h2>
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
                      <div className="text-xs text-ink-500">Commission</div>
                      <div className="font-semibold text-ink-950">{formatUsd(row.commissionAmountUsd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">Platform net</div>
                      <div className="font-semibold text-ink-950">{formatUsd(ledgerNet(row))}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                {reconciledRows}/{betaLedger.length} paid ledger rows reconciled. Every paid case must tie to quote, booking, payment, provider, and commission cap.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-ink-50">
        <div className="container-wide">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-3xl text-ink-950">300-lead test plan</h2>
              <p className="mt-1 text-sm text-ink-500">Current values are seed/test rows. Real counts update when campaigns run.</p>
            </div>
            <Link href="/admin/quote-booking">
              <Button className="bg-ink-950 text-white hover:bg-ink-800">Open Quote MVP</Button>
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
                    <span className="font-semibold text-ink-950">{segment.currentLeads}/{segment.targetLeads} leads</span>
                    <span className="text-ink-500">{formatPercent(segment.targetDepositRate)} deposit target</span>
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
              <h2 className="font-serif text-3xl text-ink-950">Provider conversion ranking</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Quote</th>
                    <th className="px-4 py-3">Deposit</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {providerRanking.map((provider, index) => (
                    <tr key={provider.id}>
                      <td className="px-4 py-3 font-serif text-xl text-ink-950">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{provider.name}</div>
                        <div className="text-xs text-ink-500">{provider.slaBreaches} SLA breaches</div>
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
              <h2 className="font-serif text-3xl text-ink-950">Channel budget focus</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">CAC</th>
                    <th className="px-4 py-3">Deposit</th>
                    <th className="px-4 py-3">Profit</th>
                    <th className="px-4 py-3">Budget</th>
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
