import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Building2, Database, Handshake, Languages, Send } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { betaCases, betaPartners, betaProviders, formatUsd, type BetaCase } from "@/lib/betaData";
import { fetchPartnerMvpSnapshot, readAdminApiToken, saveAdminApiToken, setPartnerShortlistMvp } from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

function serviceLabel(value: string) {
  return value.replaceAll("_", " ");
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
        <div className="mt-1 text-xs text-ink-500">{row.market} / {row.language.toUpperCase()}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-950">{formatUsd(row.budgetMinUsd)} - {formatUsd(row.budgetMaxUsd)}</div>
        <div className="mt-1 text-xs text-ink-500">{row.travelStart} to {row.travelEnd}</div>
      </div>
    </button>
  );
}

export default function PartnerCaseBoard() {
  const [cases, setCases] = useState(betaCases);
  const [partners, setPartners] = useState(betaPartners);
  const [providers, setProviders] = useState(betaProviders);
  const [partnerId, setPartnerId] = useState(betaPartners[0]?.id ?? "");
  const [adminToken, setAdminToken] = useState(() => readAdminApiToken());
  const [adminTokenInput, setAdminTokenInput] = useState(() => readAdminApiToken());
  const [apiStatus, setApiStatus] = useState<"demo" | "loading" | "live" | "saving" | "error">(adminToken ? "loading" : "demo");
  const [apiMessage, setApiMessage] = useState(adminToken ? "Connecting to Supabase operations..." : "Demo board");
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
    setApiMessage(`Supabase ops connected: ${snapshot.meta?.partnerRequestCount ?? snapshot.cases.length} partner requests`);
  }

  async function refreshOps(token = adminToken) {
    if (!token) return;
    setApiStatus("loading");
    setApiMessage("Loading assigned partner cases...");
    try {
      applySnapshot(await fetchPartnerMvpSnapshot(token));
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "Could not load Supabase operations.");
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

  function connectOps() {
    const token = adminTokenInput.trim();
    saveAdminApiToken(token);
    setAdminToken(token);
    if (!token) {
      setCases(betaCases);
      setPartners(betaPartners);
      setProviders(betaProviders);
      setPartnerId(betaPartners[0]?.id ?? "");
      setApiStatus("demo");
      setApiMessage("Demo board");
    }
  }

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
      setApiMessage("Partner shortlist saved");
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "Provider shortlist save failed.");
    }
  }

  const recommendedProviders = providers.filter((provider) => provider.active);

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-8">
          <Link href="/admin/cases" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="size-4" />
            Coordinator board
          </Link>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Handshake className="size-4" />
                Partner-safe case view
              </div>
              <h1 className="font-serif text-5xl text-ink-950">Partner case board</h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                Scoped operating view for assigned partners to review consented case summaries and shortlist compliant hospital candidates.
              </p>
            </div>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-700">
              Partner operator
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
              Operations data
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminTokenInput}
                onChange={(event) => setAdminTokenInput(event.target.value)}
                placeholder="Admin API token"
                className="h-10 min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm"
              />
              <Button type="button" variant="outline" onClick={connectOps} className="border-ink-300 text-ink-800">
                {adminTokenInput.trim() ? "Connect" : "Demo"}
              </Button>
            </div>
            <div className={cn("mt-2 text-xs font-semibold", apiStatus === "error" ? "text-coral-700" : liveMode ? "text-teal-700" : "text-ink-500")}>
              {apiMessage}
            </div>
          </div>

          {partner && (
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">Verification</div>
                <div className="mt-1 font-serif text-2xl text-ink-950">{partner.verificationStatus}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">Assigned cases</div>
                <div className="mt-1 font-serif text-2xl text-ink-950">{visibleCases.length}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">Languages</div>
                <div className="mt-1 text-sm font-semibold text-ink-950">{partner.languages.join(", ").toUpperCase()}</div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-ink-500">SLA</div>
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
              <div className="font-semibold text-ink-950">Assigned cases</div>
              <p className="mt-1 text-sm text-ink-500">Medical documents remain hidden in this MVP partner-safe view.</p>
            </div>
            {visibleCases.length ? (
              visibleCases.map((row) => (
                <PartnerCaseRow key={row.id} row={row} selected={selected?.id === row.id} onSelect={() => setSelectedId(row.id)} />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-ink-500">No cases assigned to this partner.</div>
            )}
          </div>

          {selected && (
            <aside className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-teal-700">{selected.id}</div>
                <h2 className="mt-1 font-serif text-3xl text-ink-950">{selected.patientAlias}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Partner-safe summary for travel, language, support services, and provider shortlisting.
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                    <Languages className="size-3.5" />
                    Language / market
                  </div>
                  <div className="font-semibold text-ink-950">{selected.market} / {selected.language.toUpperCase()}</div>
                </div>
                <div className="rounded-md bg-ink-50 p-3">
                  <div className="text-xs font-semibold uppercase text-ink-500">Requested services</div>
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
                  Select hospital candidates
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
                            {preferred ? "preferred" : `${provider.betaScore} fit`}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-ink-500">
                          {provider.languages.join(", ").toUpperCase()} / {provider.slaHours}h SLA
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                <div className="flex items-center gap-2 font-semibold">
                  <Send className="size-4" />
                  Coordinator handoff
                </div>
                <p className="mt-2 leading-6">
                  Selected providers become a partner shortlist. The coordinator still confirms compliance before sending quote requests.
                </p>
              </div>
            </aside>
          )}
        </div>
      </section>
    </Layout>
  );
}
