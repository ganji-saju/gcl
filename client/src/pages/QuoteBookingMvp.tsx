import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CalendarCheck, CheckCircle2, CircleDollarSign, ClipboardCheck, ShieldAlert, WalletCards } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  betaCases,
  betaDepositBookings,
  betaLedger,
  betaProviders,
  betaQuotes,
  formatPercent,
  formatUsd,
  getProvider,
  ledgerNet,
  type BetaDepositBooking,
  type BetaLedgerRow,
  type BetaQuote,
} from "@/lib/betaData";
import { cn } from "@/lib/utils";

function StepCard({
  icon: Icon,
  title,
  value,
  tone = "neutral",
}: {
  icon: typeof WalletCards;
  title: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "ok" && "border-teal-200 bg-teal-50",
        tone === "warn" && "border-coral-200 bg-coral-50",
        tone === "neutral" && "border-ink-200 bg-white",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <Icon className={cn("size-5", tone === "ok" ? "text-teal-700" : tone === "warn" ? "text-coral-700" : "text-ink-500")} />
      </div>
      <div className="font-serif text-2xl text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-500">{title}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const ok = ["sent", "accepted", "paid", "confirmed", "reconciled"].includes(value);
  const warn = ["pending", "requested", "draft", "unreconciled"].includes(value);
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        ok && "border-teal-200 bg-teal-50 text-teal-800",
        warn && "border-coral-200 bg-coral-50 text-coral-800",
        !ok && !warn && "border-ink-200 bg-ink-50 text-ink-700",
      )}
    >
      {value}
    </span>
  );
}

export default function QuoteBookingMvp() {
  const quoteReadyCases = betaCases.filter((row) => row.matchedProviderId);
  const [quotes, setQuotes] = useState<BetaQuote[]>(betaQuotes);
  const [deposits, setDeposits] = useState<BetaDepositBooking[]>(betaDepositBookings);
  const [ledger, setLedger] = useState<BetaLedgerRow[]>(betaLedger);
  const [caseId, setCaseId] = useState(quoteReadyCases[0]?.id ?? "");
  const selectedCase = quoteReadyCases.find((row) => row.id === caseId) ?? quoteReadyCases[0];
  const selectedProvider = getProvider(selectedCase?.matchedProviderId) ?? betaProviders[0];
  const [medicalFee, setMedicalFee] = useState(980);
  const [nonmedicalFee, setNonmedicalFee] = useState(80);
  const [commissionRate, setCommissionRate] = useState(0.15);
  const [depositAmount, setDepositAmount] = useState(150);
  const capRate = 0.3;
  const commissionOk = commissionRate <= capRate;
  const commissionAmount = medicalFee * commissionRate;
  const latestQuote = quotes[0];

  const chain = useMemo(() => {
    return quotes.map((quote) => ({
      quote,
      deposit: deposits.find((deposit) => deposit.quoteId === quote.id),
      ledger: ledger.find((row) => row.quoteId === quote.id),
    }));
  }, [deposits, ledger, quotes]);

  function createQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCase || !selectedProvider || !commissionOk) return;
    const quote: BetaQuote = {
      id: `quote-${String(quotes.length + 1).padStart(4, "0")}`,
      caseId: selectedCase.id,
      providerId: selectedProvider.id,
      medicalFeeUsd: medicalFee,
      nonmedicalFeeUsd: nonmedicalFee,
      commissionRate,
      capRate,
      depositAmountUsd: depositAmount,
      validUntil: "2026-07-01",
      status: "sent",
      sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: "Final treatment plan and price may change after provider consultation.",
    };
    setQuotes((current) => [quote, ...current]);
  }

  function markDepositPaid(quote: BetaQuote) {
    const existing = deposits.find((deposit) => deposit.quoteId === quote.id);
    if (existing?.depositStatus === "paid") return;
    const deposit: BetaDepositBooking = {
      paymentId: `pay-${String(deposits.length + 1).padStart(4, "0")}`,
      bookingId: `book-${String(deposits.length + 1).padStart(4, "0")}`,
      caseId: quote.caseId,
      quoteId: quote.id,
      depositStatus: "paid",
      depositAmountUsd: quote.depositAmountUsd,
      paidAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      scheduledAt: "2026-07-10 10:30",
      visitType: "procedure",
      bookingStatus: "confirmed",
      refundStatus: "none",
    };
    setDeposits((current) => [deposit, ...current.filter((row) => row.quoteId !== quote.id)]);
    setLedger((current) => [
      {
        id: `ledger-${String(current.length + 1).padStart(4, "0")}`,
        providerId: quote.providerId,
        caseId: quote.caseId,
        quoteId: quote.id,
        grossMedicalFeeUsd: quote.medicalFeeUsd,
        commissionRate: quote.commissionRate,
        commissionAmountUsd: quote.medicalFeeUsd * quote.commissionRate,
        partnerPayoutUsd: 0,
        paymentFeeUsd: Math.round(quote.depositAmountUsd * 0.03),
        refundCostUsd: 0,
        settlementStatus: "reconciled",
      },
      ...current,
    ]);
  }

  const paidCount = deposits.filter((row) => row.depositStatus === "paid").length;
  const confirmedCount = deposits.filter((row) => row.bookingStatus === "confirmed").length;
  const unreconciled = ledger.filter((row) => row.settlementStatus === "unreconciled").length;

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-8">
          <Link href="/admin/beta" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="size-4" />
            Beta ops
          </Link>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-serif text-5xl text-ink-950">Quote / Deposit / Booking MVP</h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                Minimum transaction workflow for beta cases: separated quote, commission cap check, deposit status, booking confirmation, and ledger row.
              </p>
            </div>
            <Link href="/admin/cases">
              <Button variant="outline" className="border-ink-300 text-ink-800">Open Case Dashboard</Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StepCard icon={WalletCards} title="Quotes sent" value={String(quotes.filter((quote) => quote.status === "sent" || quote.status === "accepted").length)} />
            <StepCard icon={CircleDollarSign} title="Deposits paid" value={String(paidCount)} tone="ok" />
            <StepCard icon={CalendarCheck} title="Bookings confirmed" value={String(confirmedCount)} tone="ok" />
            <StepCard icon={ShieldAlert} title="Unreconciled ledger rows" value={String(unreconciled)} tone={unreconciled ? "warn" : "ok"} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[430px_1fr]">
          <form onSubmit={createQuote} className="rounded-lg border border-ink-200 bg-white p-5">
            <div className="mb-5">
              <h2 className="font-serif text-3xl text-ink-950">Quote composer</h2>
              <p className="mt-1 text-sm text-ink-500">Commission is validated against the clinic cap before the quote can be sent.</p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                Case
                <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="h-11 rounded-md border border-ink-200 bg-white px-3">
                  {quoteReadyCases.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.id} / {row.packageId}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-md bg-ink-50 p-3 text-sm">
                <div className="font-semibold text-ink-950">{selectedProvider.name}</div>
                <div className="mt-1 text-ink-500">{selectedProvider.slaHours}h quote SLA / {selectedProvider.languages.join(", ").toUpperCase()}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  Medical fee
                  <input value={medicalFee} onChange={(event) => setMedicalFee(Number(event.target.value))} type="number" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  Non-medical fee
                  <input value={nonmedicalFee} onChange={(event) => setNonmedicalFee(Number(event.target.value))} type="number" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  Commission rate
                  <input
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(Number(event.target.value))}
                    step="0.01"
                    min="0"
                    max="0.5"
                    type="number"
                    className="h-11 rounded-md border border-ink-200 px-3"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-ink-700">
                  Deposit
                  <input value={depositAmount} onChange={(event) => setDepositAmount(Number(event.target.value))} type="number" className="h-11 rounded-md border border-ink-200 px-3" />
                </label>
              </div>
              <div className={cn("rounded-md border p-3 text-sm", commissionOk ? "border-teal-200 bg-teal-50 text-teal-900" : "border-coral-200 bg-coral-50 text-coral-900")}>
                <div className="font-semibold">{commissionOk ? "Commission check passed" : "ERR_COMMISSION_CAP_EXCEEDED"}</div>
                <div className="mt-1">
                  Requested {formatPercent(commissionRate)} / cap {formatPercent(capRate)} / commission {formatUsd(commissionAmount)}
                </div>
              </div>
              <Button type="submit" disabled={!commissionOk} className="bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300">
                Create quote
              </Button>
            </div>
          </form>

          <div className="grid gap-5">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="size-5 text-teal-700" />
                <h2 className="font-serif text-3xl text-ink-950">Transaction chain</h2>
              </div>
              <div className="grid gap-3">
                {chain.map(({ quote, deposit, ledger: ledgerRow }) => {
                  const provider = getProvider(quote.providerId);
                  return (
                    <div key={quote.id} className="rounded-lg border border-ink-200 bg-white p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-ink-950">{quote.id}</span>
                            <StatusPill value={quote.status} />
                            {deposit && <StatusPill value={deposit.depositStatus} />}
                            {deposit && <StatusPill value={deposit.bookingStatus} />}
                          </div>
                          <div className="mt-1 text-sm text-ink-500">{quote.caseId} / {provider?.name}</div>
                        </div>
                        <Button size="sm" onClick={() => markDepositPaid(quote)} className="bg-ink-950 text-white hover:bg-ink-800">
                          Mark deposit paid
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-5">
                        <div>
                          <div className="text-xs text-ink-500">Medical</div>
                          <div className="font-semibold text-ink-950">{formatUsd(quote.medicalFeeUsd)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-500">Non-medical</div>
                          <div className="font-semibold text-ink-950">{formatUsd(quote.nonmedicalFeeUsd)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-500">Commission</div>
                          <div className="font-semibold text-ink-950">{formatUsd(quote.medicalFeeUsd * quote.commissionRate)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-500">Deposit</div>
                          <div className="font-semibold text-ink-950">{formatUsd(quote.depositAmountUsd)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-500">Ledger net</div>
                          <div className="font-semibold text-ink-950">{ledgerRow ? formatUsd(ledgerNet(ledgerRow)) : "Pending"}</div>
                        </div>
                      </div>
                      <p className="mt-4 border-t border-ink-100 pt-3 text-xs leading-5 text-ink-500">{quote.notes}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {latestQuote && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                  <CheckCircle2 className="size-4" />
                  Latest quote ready for coordinator review
                </div>
                <div className="mt-2 font-serif text-2xl text-ink-950">{latestQuote.id} / {formatUsd(latestQuote.medicalFeeUsd + latestQuote.nonmedicalFeeUsd)}</div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
