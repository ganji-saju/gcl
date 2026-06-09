import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, CheckCircle2, MapPin, Search, Scale, SlidersHorizontal, Star, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  getLocalizedHospitalName,
  LANGUAGE_LABELS,
  REGION_LABELS,
  SAMPLE_HOSPITALS,
  SPECIALTY_LABELS,
  type LanguageCode,
  type Region,
  type Specialty,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SPECIALTIES: Array<"all" | Specialty> = ["all", "plastic_surgery", "dermatology", "dental", "hair", "wellness"];
const REGIONS: Array<"all" | Region> = ["all", "gangnam", "seongsu", "hongdae", "sinchon", "bundang", "other"];
const LANGUAGES_FILTER: LanguageCode[] = ["en", "ko", "zh", "ja", "ar", "th", "vi"];

export default function Hospitals() {
  const { t, lang } = useI18n();
  const { addItem, removeItem, isInCompare, canAdd } = useCompare();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const initialSpecialty = params.get("specialty") as Specialty | null;
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<"all" | Specialty>(initialSpecialty ?? "all");
  const [region, setRegion] = useState<"all" | Region>("all");
  const [langFilter, setLangFilter] = useState<LanguageCode[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return SAMPLE_HOSPITALS.filter((hospital) => {
      if (specialty !== "all" && hospital.specialty !== specialty) return false;
      if (region !== "all" && hospital.region !== region) return false;
      if (langFilter.length > 0 && !langFilter.every((language) => hospital.languages.includes(language))) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [hospital.nameEn, hospital.nameKo, hospital.descriptionEn, ...hospital.specialties, ...hospital.highlights]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [langFilter, region, search, specialty]);

  const toggleCompare = (hospital: (typeof SAMPLE_HOSPITALS)[number], event: React.MouseEvent) => {
    event.preventDefault();
    if (isInCompare(hospital.id)) {
      removeItem(hospital.id);
      toast.info(`Removed ${hospital.nameEn} from comparison`);
      return;
    }
    if (!canAdd) {
      toast.warning("You can compare up to 3 hospitals.");
      return;
    }
    addItem({ hospitalId: hospital.id, hospitalName: hospital.nameEn });
    toast.success(`Added ${hospital.nameEn} to comparison`);
  };

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-950 py-14 text-white">
        <div className="container-wide">
          <h1 className="font-serif text-5xl">{t("nav.hospitals")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-300">{t("hospitals.subtitle")}</p>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="container-wide">
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`${t("common.search")} hospitals, treatments, support`}
                className="h-11 border-ink-200 bg-white pl-10"
              />
            </div>
            <Button
              variant="outline"
              className={cn("h-11 border-ink-200 text-ink-800", showFilters && "bg-teal-50 text-teal-800")}
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal className="size-4" />
              {t("common.filter")}
            </Button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {SPECIALTIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSpecialty(item)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                  specialty === item
                    ? "border-ink-950 bg-ink-950 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                )}
              >
                {item === "all" ? t("hospitals.filter.all") : SPECIALTY_LABELS[item].en}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="mb-6 grid gap-5 rounded-lg border border-ink-200 bg-ink-50 p-5 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-ink-800">{t("hospitals.region")}</p>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRegion(item)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold",
                        region === item
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-ink-200 bg-white text-ink-600",
                      )}
                    >
                      {item === "all" ? "All regions" : REGION_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-ink-800">{t("hospitals.language")}</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES_FILTER.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() =>
                        setLangFilter((previous) =>
                          previous.includes(language)
                            ? previous.filter((item) => item !== language)
                            : [...previous, language],
                        )
                      }
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold",
                        langFilter.includes(language)
                          ? "border-coral-600 bg-coral-500 text-white"
                          : "border-ink-200 bg-white text-ink-600",
                      )}
                    >
                      {LANGUAGE_LABELS[language].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-ink-500">
              <span className="font-semibold text-ink-950">{filtered.length}</span> hospitals found
            </p>
            {(search || specialty !== "all" || region !== "all" || langFilter.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSpecialty("all");
                  setRegion("all");
                  setLangFilter([]);
                }}
                className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
              >
                <X className="size-4" />
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-300 py-16 text-center">
              <Search className="mx-auto mb-4 size-10 text-ink-300" />
              <p className="font-semibold text-ink-800">{t("common.noResults")}</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((hospital) => {
                const inCompare = isInCompare(hospital.id);
                const specialtyInfo = SPECIALTY_LABELS[hospital.specialty];
                return (
                  <div key={hospital.id} className="group relative">
                    <Link href={`/hospitals/${hospital.slug}`}>
                      <div className="card-hover h-full overflow-hidden rounded-lg border border-ink-200 bg-white hover:border-teal-300">
                        <img src={hospital.coverImage} alt={hospital.nameEn} className="h-48 w-full object-cover" />
                        <div className="p-5">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className={cn("rounded border px-2 py-1 text-xs font-bold", specialtyInfo.color)}>
                              {specialtyInfo.en}
                            </span>
                            <div className="flex items-center gap-1 text-sm font-semibold text-ink-800">
                              <Star className="size-4 fill-coral-500 text-coral-500" />
                              {hospital.rating}
                            </div>
                          </div>
                          <h2 className="font-serif text-2xl text-ink-950">{getLocalizedHospitalName(hospital, lang)}</h2>
                          <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                            <MapPin className="size-4 text-teal-700" />
                            {REGION_LABELS[hospital.region]}, Seoul
                          </div>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-600">{hospital.descriptionEn}</p>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {hospital.specialties.slice(0, 3).map((specialtyItem) => (
                              <span key={specialtyItem} className="rounded bg-ink-50 px-2 py-1 text-xs text-ink-600">
                                {specialtyItem}
                              </span>
                            ))}
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                            <div className="flex gap-1.5">
                              {hospital.languages.slice(0, 4).map((language) => (
                                <span
                                  key={language}
                                  className="rounded bg-teal-50 px-1.5 py-1 text-[10px] font-bold text-teal-800"
                                  title={LANGUAGE_LABELS[language]?.label}
                                >
                                  {language.toUpperCase()}
                                </span>
                              ))}
                            </div>
                            <span className="flex items-center gap-1 text-sm font-semibold text-teal-700">
                              Details <ArrowRight className="size-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={(event) => toggleCompare(hospital, event)}
                      className={cn(
                        "absolute right-3 top-3 flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold shadow transition-colors",
                        inCompare ? "bg-coral-500 text-white" : "bg-white text-ink-800 hover:bg-ink-950 hover:text-white",
                      )}
                    >
                      {inCompare ? <CheckCircle2 className="size-3.5" /> : <Scale className="size-3.5" />}
                      {inCompare ? "Comparing" : t("compare.add")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
