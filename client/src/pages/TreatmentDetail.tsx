import { Link, useParams } from "wouter";
import { ArrowRight, ChevronLeft, Clock, WalletCards } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import {
  formatKRW,
  formatUSD,
  getLocalizedTreatmentDescription,
  getLocalizedTreatmentName,
  REGION_LABELS,
  SAMPLE_HOSPITALS,
  SAMPLE_HOSPITAL_TREATMENTS,
  SAMPLE_TREATMENTS,
  SPECIALTY_LABELS,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";

export default function TreatmentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useI18n();
  const treatment = SAMPLE_TREATMENTS.find((item) => item.slug === slug);

  if (!treatment) {
    return (
      <Layout>
        <div className="container-wide py-24 text-center">
          <h1 className="mb-4 font-serif text-4xl text-ink-950">Treatment not found</h1>
          <Link href="/treatments">
            <Button variant="outline">Back to treatments</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const providers = SAMPLE_HOSPITAL_TREATMENTS.filter((item) => item.treatmentId === treatment.id)
    .map((item) => ({ ...item, hospital: SAMPLE_HOSPITALS.find((hospital) => hospital.id === item.hospitalId) }))
    .filter((item) => item.hospital);
  const specialty = SPECIALTY_LABELS[treatment.category];

  return (
    <Layout>
      <div className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-3">
          <Link href="/treatments" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-950">
            <ChevronLeft className="size-4" />
            {t("common.back")} to treatments
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="container-wide grid gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <img src={treatment.coverImage} alt={treatment.nameEn} className="mb-8 h-80 w-full rounded-lg object-cover" />
            <span className={cn("rounded border px-2 py-1 text-xs font-bold", specialty.color)}>{specialty.en}</span>
            <h1 className="mt-4 font-serif text-5xl text-ink-950">{getLocalizedTreatmentName(treatment, lang)}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-600">
              {getLocalizedTreatmentDescription(treatment, lang)}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-ink-200 p-5">
                <WalletCards className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">{formatKRW(treatment.priceMin)}</div>
                <p className="mt-1 text-sm text-ink-500">Starting estimate</p>
              </div>
              <div className="rounded-lg border border-ink-200 p-5">
                <Clock className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">
                  {treatment.recoveryDays === 0 ? "No downtime" : `${treatment.recoveryDays} days`}
                </div>
                <p className="mt-1 text-sm text-ink-500">Recovery</p>
              </div>
              <div className="rounded-lg border border-ink-200 p-5">
                <Clock className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">{treatment.durationMinutes} min</div>
                <p className="mt-1 text-sm text-ink-500">Typical duration</p>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-coral-200 bg-coral-50 p-5">
              <h2 className="mb-3 font-serif text-2xl text-ink-950">Aftercare notes</h2>
              <p className="leading-7 text-ink-700">{treatment.precautionsEn}</p>
            </div>
          </div>

          <aside className="sticky top-20 space-y-4">
            <div className="rounded-lg border border-ink-200 bg-ink-950 p-5 text-white">
              <h2 className="font-serif text-2xl">Request matched quotes</h2>
              <p className="mt-3 text-sm leading-6 text-ink-300">
                We route your request with treatment interest, dates, language, and budget.
              </p>
              <Link href={`/consultation?treatment=${treatment.slug}`}>
                <Button className="mt-5 w-full bg-teal-600 text-white hover:bg-teal-500">Start consultation</Button>
              </Link>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-serif text-2xl text-ink-950">Providers</h2>
              <div className="space-y-3">
                {providers.map(({ id, hospital, priceKrw, notes }) => (
                  <Link key={id} href={`/hospitals/${hospital!.slug}`}>
                    <div className="rounded-md border border-ink-200 p-3 hover:border-teal-300">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-ink-950">{hospital!.nameEn}</h3>
                          <p className="text-xs text-ink-500">{REGION_LABELS[hospital!.region]}</p>
                        </div>
                        <ArrowRight className="size-4 text-teal-700" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-ink-800">{formatKRW(priceKrw)}</div>
                      <p className="text-xs text-ink-500">{formatUSD(priceKrw)} · {notes}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
