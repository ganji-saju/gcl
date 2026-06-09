import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, CheckCircle2, ChevronLeft, Clock, Globe2, MapPin, Phone, Scale, ShieldCheck, Star, WalletCards } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  formatKRW,
  formatUSD,
  getLocalizedHospitalDescription,
  getLocalizedHospitalName,
  LANGUAGE_LABELS,
  REGION_LABELS,
  SAMPLE_DOCTORS,
  SAMPLE_HOSPITALS,
  SAMPLE_HOSPITAL_TREATMENTS,
  SAMPLE_TREATMENTS,
  SPECIALTY_LABELS,
} from "@/lib/sampleData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HospitalDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useI18n();
  const { addItem, removeItem, isInCompare, canAdd } = useCompare();
  const [activeImage, setActiveImage] = useState(0);

  const hospital = SAMPLE_HOSPITALS.find((item) => item.slug === slug);

  if (!hospital) {
    return (
      <Layout>
        <div className="container-wide py-24 text-center">
          <h1 className="mb-4 font-serif text-4xl text-ink-950">Hospital not found</h1>
          <Link href="/hospitals">
            <Button variant="outline">Back to hospitals</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const doctors = SAMPLE_DOCTORS.filter((doctor) => doctor.hospitalId === hospital.id);
  const offerings = SAMPLE_HOSPITAL_TREATMENTS.filter((item) => item.hospitalId === hospital.id)
    .map((item) => ({ ...item, treatment: SAMPLE_TREATMENTS.find((treatment) => treatment.id === item.treatmentId) }))
    .filter((item) => item.treatment);
  const specialty = SPECIALTY_LABELS[hospital.specialty];
  const inCompare = isInCompare(hospital.id);

  const toggleCompare = () => {
    if (inCompare) {
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
      <div className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-3">
          <Link href="/hospitals" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-950">
            <ChevronLeft className="size-4" />
            {t("common.back")} to hospitals
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="container-wide grid gap-8 py-10 lg:grid-cols-[1fr_390px]">
          <main>
            <div className="mb-5 overflow-hidden rounded-lg border border-ink-200">
              <img
                src={hospital.images[activeImage] ?? hospital.coverImage}
                alt={hospital.nameEn}
                className="h-96 w-full object-cover"
              />
              {hospital.images.length > 1 && (
                <div className="flex gap-2 border-t border-ink-200 bg-white p-3">
                  {hospital.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={cn("h-16 w-24 overflow-hidden rounded-md border", activeImage === index ? "border-teal-600" : "border-ink-200")}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={cn("rounded border px-2 py-1 text-xs font-bold", specialty.color)}>{specialty.en}</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-ink-700">
                <Star className="size-4 fill-coral-500 text-coral-500" />
                {hospital.rating} ({hospital.reviewCount.toLocaleString()} {t("hospitals.reviews")})
              </span>
            </div>

            <h1 className="font-serif text-5xl text-ink-950">{getLocalizedHospitalName(hospital, lang)}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-600">
              {getLocalizedHospitalDescription(hospital, lang)}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-ink-200 p-5">
                <MapPin className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">{REGION_LABELS[hospital.region]}</div>
                <p className="mt-1 text-sm text-ink-500">{hospital.addressEn}</p>
              </div>
              <div className="rounded-lg border border-ink-200 p-5">
                <Globe2 className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">{hospital.languages.length} languages</div>
                <p className="mt-1 text-sm text-ink-500">{hospital.languages.map((language) => LANGUAGE_LABELS[language].label).join(", ")}</p>
              </div>
              <div className="rounded-lg border border-ink-200 p-5">
                <CheckCircle2 className="mb-4 size-5 text-teal-700" />
                <div className="font-semibold text-ink-950">{hospital.priceTier} price tier</div>
                <p className="mt-1 text-sm text-ink-500">{hospital.highlights[0]}</p>
              </div>
            </div>

            <section className="mt-8 rounded-lg border border-teal-200 bg-teal-50 p-5">
              <h2 className="mb-4 font-serif text-3xl text-ink-950">International patient trust signals</h2>
              <div className="grid gap-3 md:grid-cols-4">
                <TrustSignal
                  icon={ShieldCheck}
                  title="Registration"
                  text={hospital.registrationLabel}
                  active={hospital.registrationStatus === "verified"}
                />
                <TrustSignal
                  icon={CheckCircle2}
                  title="Insurance"
                  text={hospital.insuranceVerified ? "Insurance evidence checked" : "Insurance review pending"}
                  active={hospital.insuranceVerified}
                />
                <TrustSignal icon={Clock} title="Quote SLA" text={`Target under ${hospital.responseSlaHours}h`} active />
                <TrustSignal
                  icon={WalletCards}
                  title="Package range"
                  text={`${formatUSD(hospital.packagePriceMinUsd * 1300)} - ${formatUSD(hospital.packagePriceMaxUsd * 1300)}`}
                  active
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 font-serif text-3xl text-ink-950">Care strengths</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {hospital.specialties.map((item) => (
                  <div key={item} className="rounded-md border border-ink-200 p-4 text-sm font-medium text-ink-800">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 font-serif text-3xl text-ink-950">Treatment pricing</h2>
              <div className="overflow-hidden rounded-lg border border-ink-200">
                {offerings.map(({ id, treatment, priceKrw, notes }, index) => (
                  <Link key={id} href={`/treatments/${treatment!.slug}`}>
                    <div className={cn("grid gap-4 p-4 hover:bg-teal-50/40 md:grid-cols-[1fr_180px]", index > 0 && "border-t border-ink-200")}>
                      <div>
                        <h3 className="font-semibold text-ink-950">{treatment!.nameEn}</h3>
                        <p className="mt-1 text-sm text-ink-500">{notes}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="font-semibold text-ink-950">{formatKRW(priceKrw)}</div>
                        <div className="text-sm text-ink-500">{formatUSD(priceKrw)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {doctors.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 font-serif text-3xl text-ink-950">Medical team</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="rounded-lg border border-ink-200 p-5">
                      <h3 className="font-semibold text-ink-950">{doctor.nameEn}</h3>
                      <p className="mt-1 text-sm text-teal-700">{doctor.titleEn}</p>
                      <p className="mt-3 text-sm leading-6 text-ink-600">{doctor.bioEn}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border border-ink-200 bg-ink-950 p-5 text-white">
              <h2 className="font-serif text-2xl">Shortlist this hospital</h2>
              <p className="mt-3 text-sm leading-6 text-ink-300">
                Add it to your comparison or send a request with this provider attached.
              </p>
              <div className="mt-5 grid gap-3">
                <Button onClick={toggleCompare} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Scale className="size-4" />
                  {inCompare ? "Remove from compare" : t("compare.add")}
                </Button>
                <Link href={`/consultation?hospital=${hospital.slug}`}>
                  <Button className="w-full bg-teal-600 text-white hover:bg-teal-500">
                    {t("consult.title")}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-serif text-2xl text-ink-950">Coordinator checklist</h2>
              <div className="grid gap-3">
                {hospital.highlights.map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="mt-0.5 size-4 text-teal-700" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-serif text-2xl text-ink-950">Contact</h2>
              <div className="grid gap-3 text-sm">
                <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 text-ink-600 hover:text-ink-950">
                  <Phone className="size-4 text-teal-700" />
                  {hospital.phone}
                </a>
                {hospital.website && (
                  <a href={hospital.website} className="flex items-center gap-2 text-ink-600 hover:text-ink-950" target="_blank" rel="noreferrer">
                    <Globe2 className="size-4 text-teal-700" />
                    Official website
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

function TrustSignal({
  icon: Icon,
  title,
  text,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  active: boolean;
}) {
  return (
    <div className="rounded-md border border-white bg-white p-4">
      <Icon className={cn("mb-3 size-5", active ? "text-teal-700" : "text-coral-700")} />
      <div className="text-sm font-semibold text-ink-950">{title}</div>
      <p className="mt-1 text-xs leading-5 text-ink-600">{text}</p>
    </div>
  );
}
