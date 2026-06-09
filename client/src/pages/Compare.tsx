import { Link } from "wouter";
import { ArrowRight, CheckCircle2, MapPin, Plus, Scale, Star, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  formatKRW,
  formatUSD,
  LANGUAGE_LABELS,
  REGION_LABELS,
  SAMPLE_HOSPITALS,
  SAMPLE_HOSPITAL_TREATMENTS,
  SAMPLE_TREATMENTS,
  SPECIALTY_LABELS,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";

export default function Compare() {
  const { t } = useI18n();
  const { items, removeItem, clearAll } = useCompare();

  const hospitals = items
    .map((item) => SAMPLE_HOSPITALS.find((hospital) => hospital.id === item.hospitalId))
    .filter(Boolean) as typeof SAMPLE_HOSPITALS;

  const treatmentIds = new Set<number>();
  hospitals.forEach((hospital) => {
    SAMPLE_HOSPITAL_TREATMENTS.filter((item) => item.hospitalId === hospital.id).forEach((item) =>
      treatmentIds.add(item.treatmentId),
    );
  });
  const treatments = SAMPLE_TREATMENTS.filter((treatment) => treatmentIds.has(treatment.id));

  const getOffering = (hospitalId: number, treatmentId: number) => {
    return SAMPLE_HOSPITAL_TREATMENTS.find((item) => item.hospitalId === hospitalId && item.treatmentId === treatmentId);
  };

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-950 py-14 text-white">
        <div className="container-wide">
          <h1 className="font-serif text-5xl">{t("compare.title")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-300">{t("compare.subtitle")}</p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container-wide">
          {hospitals.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-lg border border-dashed border-ink-300 p-10 text-center">
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-md bg-teal-50 text-teal-700">
                <Scale className="size-8" />
              </div>
              <h2 className="font-serif text-3xl text-ink-950">{t("compare.empty")}</h2>
              <p className="mt-3 text-ink-500">Browse providers and add up to three hospitals to compare logistics.</p>
              <Link href="/hospitals">
                <Button className="mt-6 bg-teal-700 text-white hover:bg-teal-800">
                  Browse hospitals
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-ink-500">
                  Comparing <span className="font-semibold text-ink-950">{hospitals.length}</span> hospitals
                </p>
                <button type="button" onClick={clearAll} className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-950">
                  <X className="size-4" />
                  Clear all
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="bg-ink-950 text-white">
                      <th className="w-48 p-4 text-left font-semibold text-ink-300">Criteria</th>
                      {hospitals.map((hospital) => (
                        <th key={hospital.id} className="min-w-56 p-4 text-left align-top">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => removeItem(hospital.id)}
                              className="absolute right-0 top-0 rounded bg-white/10 p-1 text-white hover:bg-coral-500"
                              aria-label={`Remove ${hospital.nameEn}`}
                            >
                              <X className="size-3" />
                            </button>
                            <img src={hospital.coverImage} alt={hospital.nameEn} className="mb-3 h-24 w-full rounded-md object-cover" />
                            <div className="font-serif text-xl leading-tight">{hospital.nameEn}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-coral-200">
                              <Star className="size-3 fill-coral-300 text-coral-300" />
                              {hospital.rating}
                            </div>
                          </div>
                        </th>
                      ))}
                      {hospitals.length < 3 && (
                        <th className="min-w-40 p-4 align-middle">
                          <Link href="/hospitals">
                            <div className="grid place-items-center rounded-md border border-dashed border-white/30 p-6 text-center text-ink-300 hover:border-teal-300 hover:text-teal-200">
                              <Plus className="mb-2 size-6" />
                              Add hospital
                            </div>
                          </Link>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-ink-200 bg-ink-50">
                      <td className="p-4 font-semibold text-ink-700">Specialty</td>
                      {hospitals.map((hospital) => (
                        <td key={hospital.id} className="p-4">
                          <span className={cn("rounded border px-2 py-1 text-xs font-bold", SPECIALTY_LABELS[hospital.specialty].color)}>
                            {SPECIALTY_LABELS[hospital.specialty].en}
                          </span>
                        </td>
                      ))}
                      {hospitals.length < 3 && <td />}
                    </tr>
                    <tr className="border-t border-ink-200">
                      <td className="p-4 font-semibold text-ink-700">Region</td>
                      {hospitals.map((hospital) => (
                        <td key={hospital.id} className="p-4 text-ink-700">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-4 text-teal-700" />
                            {REGION_LABELS[hospital.region]}
                          </span>
                        </td>
                      ))}
                      {hospitals.length < 3 && <td />}
                    </tr>
                    <tr className="border-t border-ink-200 bg-ink-50">
                      <td className="p-4 font-semibold text-ink-700">Languages</td>
                      {hospitals.map((hospital) => (
                        <td key={hospital.id} className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {hospital.languages.map((language) => (
                              <span key={language} className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink-700">
                                {LANGUAGE_LABELS[language].label}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                      {hospitals.length < 3 && <td />}
                    </tr>
                    <tr className="border-t border-ink-200">
                      <td className="p-4 font-semibold text-ink-700">Certifications</td>
                      {hospitals.map((hospital) => (
                        <td key={hospital.id} className="p-4">
                          <div className="grid gap-1.5">
                            {hospital.certifications.slice(0, 3).map((item) => (
                              <span key={item} className="flex items-center gap-1 text-xs text-ink-600">
                                <CheckCircle2 className="size-3 text-teal-700" />
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                      {hospitals.length < 3 && <td />}
                    </tr>

                    {treatments.map((treatment, index) => (
                      <tr key={treatment.id} className={cn("border-t border-ink-200", index % 2 === 0 && "bg-ink-50")}>
                        <td className="p-4">
                          <div className="font-semibold text-ink-800">{treatment.nameEn}</div>
                          <div className="mt-1 text-xs text-ink-500">
                            {treatment.recoveryDays === 0 ? "No downtime" : `${treatment.recoveryDays}d recovery`}
                          </div>
                        </td>
                        {hospitals.map((hospital) => {
                          const offering = getOffering(hospital.id, treatment.id);
                          return (
                            <td key={hospital.id} className="p-4">
                              {offering ? (
                                <div>
                                  <div className="font-semibold text-ink-950">{formatKRW(offering.priceKrw)}</div>
                                  <div className="text-xs text-ink-500">{formatUSD(offering.priceKrw)}</div>
                                  <div className="mt-1 text-xs text-ink-500">{offering.notes}</div>
                                </div>
                              ) : (
                                <span className="text-ink-300">Not listed</span>
                              )}
                            </td>
                          );
                        })}
                        {hospitals.length < 3 && <td />}
                      </tr>
                    ))}

                    <tr className="border-t border-ink-200 bg-teal-50">
                      <td className="p-4 font-semibold text-ink-700">Next action</td>
                      {hospitals.map((hospital) => (
                        <td key={hospital.id} className="p-4">
                          <Link href={`/consultation?hospital=${hospital.slug}`}>
                            <Button size="sm" className="w-full bg-teal-700 text-white hover:bg-teal-800">Request quote</Button>
                          </Link>
                        </td>
                      ))}
                      {hospitals.length < 3 && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
