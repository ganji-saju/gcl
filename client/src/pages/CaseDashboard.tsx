import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Building2, CalendarClock, ClipboardList, Filter, Handshake, Languages, Send, UserRoundCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  betaCases,
  betaPartners,
  betaProviders,
  type BetaCase,
  type BetaCaseStatus,
  formatUsd,
  getPartner,
  getProvider,
} from "@/lib/betaData";
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
  const partner = getPartner(row.assignedPartnerId);
  const slaRisk = row.status === "quote_requested" || row.firstResponseMinutes > 5 || row.riskFlags.length > 0;
  const partnerRequested = row.partnerAssistanceMode && row.partnerAssistanceMode !== "platform_direct";

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
        <div className="text-xs text-ink-500">{partnerRequested ? partner?.name ?? "Partner requested" : row.source} / {row.campaign}</div>
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

  function assignPartner(partnerId: string) {
    if (!selected) return;
    setCases((current) =>
      current.map((row) =>
        row.id === selected.id
          ? {
              ...row,
              assignedPartnerId: partnerId || undefined,
              partnerAssistanceMode: row.partnerAssistanceMode === "platform_direct" ? "partner_requested" : row.partnerAssistanceMode,
              nextAction: partnerId ? "Partner assigned; review provider shortlist" : "Assign partner for requested services",
            }
          : row,
      ),
    );
  }

  function togglePartnerShortlist(providerId: string) {
    if (!selected) return;
    setCases((current) =>
      current.map((row) => {
        if (row.id !== selected.id) return row;
        const existing = row.partnerShortlistedProviderIds ?? [];
        const nextShortlist = existing.includes(providerId) ? existing.filter((id) => id !== providerId) : [...existing, providerId];
        return {
          ...row,
          partnerShortlistedProviderIds: nextShortlist,
          nextAction: nextShortlist.length ? "Coordinator to request quotes from partner shortlist" : "Partner should select provider candidates",
        };
      }),
    );
  }

  function requestQuotesFromShortlist() {
    if (!selected) return;
    const shortlist = selected.partnerShortlistedProviderIds ?? [];
    if (!shortlist.length) return;
    setCases((current) =>
      current.map((row) =>
        row.id === selected.id
          ? {
              ...row,
              status: "quote_requested",
              matchedProviderId: row.matchedProviderId ?? shortlist[0],
              quoteRequestedProviderIds: Array.from(new Set([...(row.quoteRequestedProviderIds ?? []), ...shortlist])),
              nextAction: "Provider quote SLA check",
              nextActionAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : row,
      ),
    );
  }

  const counts = statusOrder.map((status) => ({
    status,
    count: cases.filter((row) => row.status === status).length,
  }));
  const partnerRequestedCount = cases.filter((row) => row.partnerAssistanceMode && row.partnerAssistanceMode !== "platform_direct").length;
  const partnerAssignedCount = cases.filter((row) => row.assignedPartnerId).length;

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
              <p className="mt-3 max-w-2xl text-ink-600">Live operating surface for lead qualification, partner assignment, provider shortlisting, quote SLA, deposit follow-up, and booking readiness.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner/cases">
                <Button variant="outline" className="border-ink-300 text-ink-800">
                  Partner view
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/admin/quote-booking">
                <Button className="bg-teal-700 text-white hover:bg-teal-800">
                  Quote / Deposit / Booking
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-6">
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-left">
              <div className="font-serif text-2xl text-ink-950">{partnerRequestedCount}</div>
              <div className="text-xs font-semibold text-teal-700">partner requested</div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-white p-3 text-left">
              <div className="font-serif text-2xl text-ink-950">{partnerAssignedCount}</div>
              <div className="text-xs font-semibold text-ink-500">partner assigned</div>
            </div>
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

              <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-900">
                  <Handshake className="size-4" />
                  Partner service request
                </div>
                <div className="grid gap-2 text-sm text-ink-700">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500">Mode</span>
                    <span className="font-semibold text-ink-950">{selected.partnerAssistanceMode ?? "platform_direct"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-500">Consent</span>
                    <span className={cn("font-semibold", selected.partnerShareConsent ? "text-teal-700" : "text-coral-700")}>
                      {selected.partnerShareConsent ? "shared scope approved" : "needs consent"}
                    </span>
                  </div>
                  <div>
                    <div className="mb-1 text-ink-500">Requested services</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selected.requestedPartnerServices?.length ? selected.requestedPartnerServices : ["none"]).map((service) => (
                        <span key={service} className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink-700">
                          {service.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <label className="mt-2 grid gap-1.5 font-medium text-ink-800">
                    Assign partner
                    <select
                      value={selected.assignedPartnerId ?? ""}
                      onChange={(event) => assignPartner(event.target.value)}
                      className="h-11 rounded-md border border-teal-200 bg-white px-3 text-sm text-ink-900"
                    >
                      <option value="">Unassigned</option>
                      {betaPartners.filter((partner) => partner.active).map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} / {partner.type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-ink-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <Building2 className="size-4 text-teal-700" />
                  Partner provider shortlist
                </div>
                <div className="grid gap-2">
                  {betaProviders.filter((provider) => provider.active).map((provider) => {
                    const selectedForShortlist = Boolean(selected.partnerShortlistedProviderIds?.includes(provider.id));
                    const requested = Boolean(selected.quoteRequestedProviderIds?.includes(provider.id));
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => togglePartnerShortlist(provider.id)}
                        className={cn(
                          "rounded-md border p-3 text-left text-sm transition-colors",
                          selectedForShortlist ? "border-teal-300 bg-teal-50" : "border-ink-200 bg-ink-50 hover:bg-white",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-ink-950">{provider.name}</span>
                          <span className={cn("text-xs font-bold", requested ? "text-teal-700" : "text-ink-400")}>
                            {requested ? "quote requested" : `${provider.betaScore} fit`}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-ink-500">
                          {provider.languages.join(", ").toUpperCase()} / {provider.slaHours}h SLA
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
                  Coordinator request quote
                </Button>
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
