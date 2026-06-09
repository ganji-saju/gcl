import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarClock, ClipboardList, Filter, Languages, UserRoundCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { betaCases, betaProviders, type BetaCase, type BetaCaseStatus, formatUsd, getProvider } from "@/lib/betaData";
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
  if (status === "deposit_paid" || status === "booking_confirmed") return "border-teal-200 bg-teal-50 text-teal-800";
  if (status === "deposit_pending" || status === "quote_sent") return "border-coral-200 bg-coral-50 text-coral-800";
  if (status === "closed_lost") return "border-ink-300 bg-ink-100 text-ink-600";
  return "border-ink-200 bg-white text-ink-700";
}

function StatusPill({ status }: { status: BetaCaseStatus }) {
  return <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", statusClass(status))}>{status.replace("_", " ")}</span>;
}

function nextStatus(status: BetaCaseStatus): BetaCaseStatus {
  const index = statusOrder.indexOf(status);
  return statusOrder[Math.min(index + 1, statusOrder.length - 1)];
}

function CaseRow({ row, selected, onSelect }: { row: BetaCase; selected: boolean; onSelect: () => void }) {
  const provider = getProvider(row.matchedProviderId);
  const slaRisk = row.status === "quote_requested" || row.firstResponseMinutes > 5 || row.riskFlags.length > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-4 border-b border-ink-100 p-4 text-left transition-colors md:grid-cols-[1.05fr_0.75fr_0.8fr_0.7fr_0.9fr]",
        selected ? "bg-teal-50/60" : "bg-white hover:bg-ink-50",
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-950">{row.id}</span>
          <StatusPill status={row.status} />
        </div>
        <div className="mt-1 text-sm text-ink-500">{row.patientAlias} / {row.packageId}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{row.procedure}</div>
        <div className="text-xs text-ink-500">{row.market} / {row.locale.toUpperCase()} / {row.language.toUpperCase()}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{provider?.name ?? "Unmatched"}</div>
        <div className="text-xs text-ink-500">{row.source} / {row.campaign}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{formatUsd(row.budgetMinUsd)} - {formatUsd(row.budgetMaxUsd)}</div>
        <div className="text-xs text-ink-500">{row.travelStart} to {row.travelEnd}</div>
      </div>
      <div>
        <div className={cn("text-sm font-semibold", slaRisk ? "text-coral-700" : "text-teal-700")}>
          {slaRisk ? "SLA watch" : "On track"}
        </div>
        <div className="text-xs text-ink-500">{row.nextActionAt}</div>
      </div>
    </button>
  );
}

export default function CaseDashboard() {
  const [cases, setCases] = useState(betaCases);
  const [statusFilter, setStatusFilter] = useState<BetaCaseStatus | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");

  const owners = useMemo(() => Array.from(new Set(cases.map((row) => row.owner))), [cases]);
  const filtered = cases.filter((row) => {
    const statusMatch = statusFilter === "all" || row.status === statusFilter;
    const ownerMatch = ownerFilter === "all" || row.owner === ownerFilter;
    return statusMatch && ownerMatch;
  });
  const selected = cases.find((row) => row.id === selectedId) ?? filtered[0] ?? cases[0];
  const selectedProvider = getProvider(selected?.matchedProviderId);

  function advanceSelected() {
    if (!selected) return;
    const target = nextStatus(selected.status);
    setCases((current) => current.map((row) => (row.id === selected.id ? { ...row, status: target, nextAction: `Move to ${target}` } : row)));
  }

  function assignProvider(providerId: string) {
    if (!selected) return;
    setCases((current) => current.map((row) => (row.id === selected.id ? { ...row, matchedProviderId: providerId, status: "quote_requested" } : row)));
  }

  const counts = statusOrder.map((status) => ({
    status,
    count: cases.filter((row) => row.status === status).length,
  }));

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-white">
        <div className="container-wide py-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ClipboardList className="size-4" />
                Coordinator case dashboard
              </div>
              <h1 className="font-serif text-5xl text-ink-950">Closed beta case board</h1>
              <p className="mt-3 max-w-2xl text-ink-600">Live operating surface for lead qualification, manual matching, quote SLA, deposit follow-up, and booking readiness.</p>
            </div>
            <Link href="/admin/quote-booking">
              <Button className="bg-teal-700 text-white hover:bg-teal-800">
                Quote / Deposit / Booking
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-6">
            {counts.filter((item) => item.count > 0 || visibleStatuses.includes(item.status)).slice(0, 6).map((item) => (
              <button
                key={item.status}
                type="button"
                onClick={() => setStatusFilter(item.status)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  statusFilter === item.status ? "border-teal-300 bg-teal-50" : "border-ink-200 bg-ink-50 hover:bg-white",
                )}
              >
                <div className="font-serif text-2xl text-ink-950">{item.count}</div>
                <div className="text-xs font-semibold text-ink-500">{item.status.replace("_", " ")}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-ink-50">
        <div className="container-wide grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 font-semibold text-ink-950">
                <Filter className="size-4 text-teal-700" />
                Case queue
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as BetaCaseStatus | "all")}
                  className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="all">All statuses</option>
                  {statusOrder.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <select
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                  className="h-10 rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="all">All owners</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[920px]">
                <div className="grid gap-4 border-b border-ink-100 bg-ink-50 px-4 py-3 text-xs font-bold uppercase text-ink-500 md:grid-cols-[1.05fr_0.75fr_0.8fr_0.7fr_0.9fr]">
                  <div>Case</div>
                  <div>Request</div>
                  <div>Provider / source</div>
                  <div>Budget / travel</div>
                  <div>SLA / next</div>
                </div>
                {filtered.map((row) => (
                  <CaseRow key={row.id} row={row} selected={selected?.id === row.id} onSelect={() => setSelectedId(row.id)} />
                ))}
              </div>
            </div>
          </div>

          {selected && (
            <aside className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase text-teal-700">{selected.id}</div>
                  <h2 className="mt-1 font-serif text-3xl text-ink-950">{selected.patientAlias}</h2>
                </div>
                <StatusPill status={selected.status} />
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                    <Languages className="size-3.5" />
                    Language / market
                  </div>
                  <div className="font-semibold text-ink-950">{selected.market} / {selected.language.toUpperCase()} / {selected.locale.toUpperCase()}</div>
                </div>
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                    <CalendarClock className="size-3.5" />
                    Travel window
                  </div>
                  <div className="font-semibold text-ink-950">{selected.travelStart} to {selected.travelEnd}</div>
                </div>
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                    <UserRoundCheck className="size-3.5" />
                    Matched provider
                  </div>
                  <div className="font-semibold text-ink-950">{selectedProvider?.name ?? "Not matched"}</div>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-coral-200 bg-coral-50 p-4">
                <div className="text-sm font-semibold text-coral-900">Next action</div>
                <p className="mt-1 text-sm leading-6 text-ink-700">{selected.nextAction}</p>
                <div className="mt-2 text-xs font-semibold text-coral-800">{selected.nextActionAt}</div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button onClick={advanceSelected} className="w-full bg-teal-700 text-white hover:bg-teal-800">
                  Advance state
                </Button>
                <select
                  value={selected.matchedProviderId ?? ""}
                  onChange={(event) => assignProvider(event.target.value)}
                  className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900"
                >
                  <option value="">Assign provider</option>
                  {betaProviders.filter((provider) => provider.active).map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {selected.riskFlags.length > 0 && (
                <div className="mt-5 rounded-md border border-coral-200 p-3 text-sm text-coral-800">
                  Risk flags: {selected.riskFlags.join(", ")}
                </div>
              )}
            </aside>
          )}
        </div>
      </section>
    </Layout>
  );
}
