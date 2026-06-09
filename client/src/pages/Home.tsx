import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Globe2,
  HeartPulse,
  Languages,
  Plane,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import {
  formatKRW,
  formatUSD,
  getLocalizedHospitalName,
  SAMPLE_HOSPITALS,
  SAMPLE_HOSPITAL_TREATMENTS,
  SAMPLE_TREATMENTS,
  SPECIALTY_LABELS,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";

const goals = [
  { key: "plastic_surgery", label: "Facial surgery", icon: Sparkles },
  { key: "dermatology", label: "Skin program", icon: HeartPulse },
  { key: "dental", label: "Smile design", icon: Stethoscope },
  { key: "wellness", label: "Checkup / recovery", icon: ClipboardList },
];

function HeroSection() {
  const { t, lang } = useI18n();
  const [goal, setGoal] = useState("dermatology");

  const matches = useMemo(() => {
    return SAMPLE_HOSPITALS.filter((hospital) => hospital.specialty === goal || goal === "wellness").slice(0, 3);
  }, [goal]);

  return (
    <section className="clinical-grid border-b border-ink-200 bg-white">
      <div className="container-wide grid min-h-[680px] gap-12 py-10 lg:grid-cols-[1fr_480px] lg:items-center">
        <div className="max-w-3xl">
          <h1 className="text-balance font-serif text-5xl text-ink-950 sm:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{t("hero.copy")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/consultation">
              <Button size="lg" className="btn-scale h-12 bg-teal-700 px-6 text-white hover:bg-teal-800">
                {t("hero.primary")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" variant="outline" className="h-12 border-ink-300 px-6 text-ink-800 hover:bg-ink-50">
                {t("hero.secondary")}
                <Scale className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 border-y border-ink-200 py-5 sm:grid-cols-3">
            {[
              ["42", "curated care paths"],
              ["8", "languages routed"],
              ["24h", "first response target"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="font-serif text-3xl text-ink-950">{value}</div>
                <div className="text-sm text-ink-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-shadow rounded-lg border border-ink-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-ink-950">Patient match desk</h2>
              <p className="text-sm text-ink-500">Preview how coordinators shortlist options.</p>
            </div>
            <div className="grid size-10 place-items-center rounded-md bg-teal-50 text-teal-700">
              <ShieldCheck className="size-5" />
            </div>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-ink-700">
              Treatment goal
              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              >
                {goals.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-ink-200 p-3">
                <div className="text-xs font-semibold text-ink-500">Destination</div>
                <div className="mt-1 text-sm text-ink-950">Seoul, Korea</div>
              </div>
              <div className="rounded-md border border-ink-200 p-3">
                <div className="text-xs font-semibold text-ink-500">Budget</div>
                <div className="mt-1 text-sm text-ink-950">$1k - $7k</div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {matches.map((hospital) => (
              <Link key={hospital.id} href={`/hospitals/${hospital.slug}`}>
                <div className="card-hover flex gap-3 rounded-md border border-ink-200 p-3 hover:border-teal-300">
                  <img src={hospital.coverImage} alt={hospital.nameEn} className="size-16 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-ink-950">
                        {getLocalizedHospitalName(hospital, lang)}
                      </h3>
                      <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-700">
                        {hospital.rating}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{hospital.highlights.join(" · ")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategorySection() {
  const { t } = useI18n();

  const categories = [
    { key: "plastic_surgery", title: t("cat.plastic"), image: SAMPLE_TREATMENTS[0].coverImage },
    { key: "dermatology", title: t("cat.dermatology"), image: SAMPLE_TREATMENTS[2].coverImage },
    { key: "dental", title: t("cat.dental"), image: SAMPLE_TREATMENTS[4].coverImage },
    { key: "hair", title: t("cat.hair"), image: SAMPLE_TREATMENTS[5].coverImage },
    { key: "wellness", title: t("cat.wellness"), image: SAMPLE_TREATMENTS[6].coverImage },
  ];

  return (
    <section className="section-padding bg-ink-50">
      <div className="container-wide">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-4xl text-ink-950">{t("cat.title")}</h2>
            <p className="mt-3 max-w-2xl text-ink-600">{t("cat.subtitle")}</p>
          </div>
          <Link href="/treatments">
            <Button variant="outline" className="border-ink-300 text-ink-800">
              {t("common.seeAll")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.key} href={`/treatments?cat=${category.key}`}>
              <div className="card-hover overflow-hidden rounded-lg border border-ink-200 bg-white">
                <img src={category.image} alt={category.title} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-ink-950">{category.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-ink-500">Compare providers, quotes, and recovery logistics.</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedHospitals() {
  const { t, lang } = useI18n();
  const featured = SAMPLE_HOSPITALS.filter((hospital) => hospital.featured).slice(0, 3);

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-4xl text-ink-950">{t("hospitals.title")}</h2>
            <p className="mt-3 max-w-2xl text-ink-600">{t("hospitals.subtitle")}</p>
          </div>
          <Link href="/hospitals">
            <Button className="bg-ink-950 text-white hover:bg-ink-800">
              {t("hospitals.viewAll")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-200">
          {featured.map((hospital, index) => (
            <Link key={hospital.id} href={`/hospitals/${hospital.slug}`}>
              <div
                className={cn(
                  "grid gap-4 bg-white p-4 transition-colors hover:bg-teal-50/40 md:grid-cols-[180px_1fr_210px]",
                  index > 0 && "border-t border-ink-200",
                )}
              >
                <img src={hospital.coverImage} alt={hospital.nameEn} className="h-32 w-full rounded-md object-cover" />
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={cn("rounded border px-2 py-1 text-xs font-semibold", SPECIALTY_LABELS[hospital.specialty].color)}>
                      {SPECIALTY_LABELS[hospital.specialty].en}
                    </span>
                    <span className="text-sm font-semibold text-ink-700">{hospital.rating} rating</span>
                  </div>
                  <h3 className="font-serif text-2xl text-ink-950">{getLocalizedHospitalName(hospital, lang)}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-600">{hospital.descriptionEn}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="rounded-md bg-ink-50 p-3">
                    <div className="text-xs font-semibold text-ink-500">Languages</div>
                    <div className="mt-1 text-ink-950">{hospital.languages.join(", ").toUpperCase()}</div>
                  </div>
                  <div className="rounded-md bg-coral-50 p-3">
                    <div className="text-xs font-semibold text-coral-700">Coordinator note</div>
                    <div className="mt-1 text-ink-900">{hospital.highlights[0]}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { icon: ClipboardList, title: "Share your goal", text: "Treatment interest, dates, language, and budget are captured in Supabase." },
    { icon: Scale, title: "Compare providers", text: "Shortlist hospitals by price, certification, language, and recovery support." },
    { icon: CalendarCheck, title: "Confirm plan", text: "Coordinator aligns quote, schedule, documents, and travel-ready next steps." },
    { icon: Plane, title: "Arrive supported", text: "Keep aftercare, translation, and recovery notes visible throughout the journey." },
  ];

  return (
    <section id="process" className="section-padding border-y border-ink-200 bg-ink-950 text-white">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-4xl">From lead to arrival, one clean workflow</h2>
          <p className="mt-3 text-ink-300">Built for a real patient acquisition operation with data capture, routing, and follow-up.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-white/15 bg-white/5 p-5">
              <step.icon className="mb-5 size-6 text-teal-300" />
              <div className="mb-2 text-xs font-semibold text-coral-200">0{index + 1}</div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-300">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConsultationPreview() {
  const popular = SAMPLE_TREATMENTS.filter((treatment) => treatment.popular).slice(0, 4);
  const firstPrice = SAMPLE_HOSPITAL_TREATMENTS[2].priceKrw;

  return (
    <section className="section-padding bg-white">
      <div className="container-wide grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <h2 className="font-serif text-4xl text-ink-950">Supabase-ready consultation pipeline</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-600">
            The public form stores patient inquiries in Supabase with consent, source path, language, hospital, treatment,
            budget, and message fields. Vercel only needs two public environment variables.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, text: "RLS insert policy for anonymous leads" },
              { icon: Languages, text: "Language and nationality captured" },
              { icon: Globe2, text: "UTM/source path recorded" },
              { icon: CheckCircle2, text: "Demo fallback before Supabase keys" },
            ].map((item) => (
              <div key={item.text} className="flex gap-3 rounded-md border border-ink-200 p-4">
                <item.icon className="size-5 text-teal-700" />
                <span className="text-sm font-medium text-ink-800">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-2xl text-ink-950">Quote snapshot</h3>
            <span className="rounded bg-teal-100 px-2 py-1 text-xs font-bold text-teal-800">LIVE FORM</span>
          </div>
          <div className="space-y-3">
            {popular.map((treatment) => (
              <div key={treatment.id} className="flex items-center justify-between rounded-md bg-white p-3 text-sm">
                <span className="font-medium text-ink-800">{treatment.nameEn}</span>
                <span className="text-ink-500">{formatUSD(treatment.priceMin)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-coral-50 p-4 text-sm text-ink-700">
            Example dermatology session starts near {formatKRW(firstPrice)}. Final quotes must be confirmed by the
            provider.
          </div>
          <Link href="/consultation">
            <Button className="mt-4 w-full bg-teal-700 text-white hover:bg-teal-800">Open consultation form</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <CategorySection />
      <FeaturedHospitals />
      <ProcessSection />
      <ConsultationPreview />
    </Layout>
  );
}
