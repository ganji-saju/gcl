import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, Clock, Search, WalletCards } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/contexts/I18nContext";
import {
  formatKRW,
  formatUSD,
  getLocalizedTreatmentDescription,
  getLocalizedTreatmentName,
  SAMPLE_HOSPITAL_TREATMENTS,
  SAMPLE_TREATMENTS,
  SPECIALTY_LABELS,
  SPECIALTY_TRANSLATION_KEYS,
  type Specialty,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<"all" | Specialty> = ["all", "plastic_surgery", "dermatology", "dental", "hair", "wellness"];

export default function Treatments() {
  const { t, lang } = useI18n();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initialCategory = params.get("cat") as Specialty | null;
  const [activeCategory, setActiveCategory] = useState<"all" | Specialty>(initialCategory ?? "all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return SAMPLE_TREATMENTS.filter((treatment) => {
      if (activeCategory !== "all" && treatment.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [
        treatment.nameEn,
        treatment.nameKo,
        treatment.nameZh,
        treatment.nameJa,
        treatment.nameAr,
        treatment.descriptionEn,
        treatment.descriptionKo,
        treatment.descriptionZh,
        treatment.descriptionJa,
        treatment.descriptionAr,
        t(SPECIALTY_TRANSLATION_KEYS[treatment.category]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [activeCategory, search, t]);

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-950 py-14 text-white">
        <div className="container-wide">
          <h1 className="font-serif text-5xl">{t("treatments.title")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-300">{t("treatments.subtitle")}</p>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="container-wide">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-96">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("treatments.searchPlaceholder")}
                className="h-11 border-ink-200 pl-10"
              />
            </div>
            <p className="text-sm text-ink-500">
              <span className="font-semibold text-ink-950">{filtered.length}</span> {t("treatments.programs")}
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  activeCategory === category
                    ? "border-ink-950 bg-ink-950 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                )}
              >
                {category === "all" ? t("hospitals.filter.all") : t(SPECIALTY_TRANSLATION_KEYS[category])}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((treatment) => {
              const providers = SAMPLE_HOSPITAL_TREATMENTS.filter((item) => item.treatmentId === treatment.id).length;
              const specialty = SPECIALTY_LABELS[treatment.category];
              return (
                <Link key={treatment.id} href={`/treatments/${treatment.slug}`}>
                  <div className="card-hover h-full overflow-hidden rounded-lg border border-ink-200 bg-white hover:border-teal-300">
                    <img src={treatment.coverImage} alt={treatment.nameEn} className="h-44 w-full object-cover" />
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className={cn("rounded border px-2 py-1 text-xs font-bold", specialty.color)}>
                          {t(SPECIALTY_TRANSLATION_KEYS[treatment.category])}
                        </span>
                        {treatment.popular && (
                          <span className="rounded bg-coral-50 px-2 py-1 text-xs font-bold text-coral-700">
                            {t("treatments.popular")}
                          </span>
                        )}
                      </div>
                      <h2 className="min-h-14 font-serif text-2xl leading-tight text-ink-950">
                        {getLocalizedTreatmentName(treatment, lang)}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-600">
                        {getLocalizedTreatmentDescription(treatment, lang)}
                      </p>
                      <div className="mt-5 grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-ink-600">
                          <WalletCards className="size-4 text-teal-700" />
                          {t("treatments.priceFrom")} {formatKRW(treatment.priceMin)}
                        </div>
                        <div className="flex items-center gap-2 text-ink-600">
                          <Clock className="size-4 text-teal-700" />
                          {treatment.recoveryDays === 0
                            ? t("treatments.noDowntime")
                            : `${treatment.recoveryDays} ${t("treatments.days")} ${t("treatments.recovery")}`}
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-sm">
                        <span className="text-ink-500">
                          {providers} {t("treatments.providers")}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-teal-700">
                          {formatUSD(treatment.priceMin)} <ArrowRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
