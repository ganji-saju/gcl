import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { CheckCircle2, Clock, Database, Globe2, LockKeyhole, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, useI18n } from "@/contexts/I18nContext";
import { getLocalizedHospitalName, getLocalizedTreatmentName, SAMPLE_HOSPITALS, SAMPLE_TREATMENTS } from "@/lib/sampleData";
import { isSupabaseConfigured, submitInquiry, type InquiryResult } from "@/lib/supabase";
import { getSkinPackageById, SKIN_PACKAGE_SKUS } from "@/lib/wedgeData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormData {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  residenceCountry?: string;
  preferredLanguage: string;
  treatmentInterest?: string;
  packageInterest?: string;
  market?: string;
  hospitalSlug?: string;
  preferredDate?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  budget?: string;
  message?: string;
  hasKoreanNationalHealthInsurance?: boolean;
  hasKoreanAlienRegistration?: boolean;
  hasOverseasKoreanResidenceReport?: boolean;
  consentMarketing?: boolean;
  consent: boolean;
}

const BUDGETS = [
  { label: "Under $1,000", min: 0, max: 1000 },
  { label: "$1,000 - $3,000", min: 1000, max: 3000 },
  { label: "$3,000 - $5,000", min: 3000, max: 5000 },
  { label: "$5,000 - $10,000", min: 5000, max: 10000 },
  { label: "$10,000 - $20,000", min: 10000, max: 20000 },
  { label: "Over $20,000", min: 20000, max: 50000 },
  { label: "Flexible", min: undefined, max: undefined },
];

export default function Consultation() {
  const { t, lang } = useI18n();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preselectedHospital = params.get("hospital") ?? "";
  const preselectedTreatment = params.get("treatment") ?? "";
  const preselectedPackage = params.get("package") ?? "";
  const preselectedMarket = params.get("market") ?? "";
  const sourceLanding = params.get("source_landing") ?? "";
  const [submitted, setSubmitted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<InquiryResult | null>(null);

  const resolvedHospital = useMemo(() => {
    return SAMPLE_HOSPITALS.find((hospital) => hospital.slug === preselectedHospital || String(hospital.id) === preselectedHospital);
  }, [preselectedHospital]);
  const resolvedPackage = useMemo(() => getSkinPackageById(preselectedPackage), [preselectedPackage]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      preferredLanguage: lang,
      hospitalSlug: resolvedHospital?.slug ?? "",
      treatmentInterest: preselectedTreatment || resolvedPackage?.treatmentSlug,
      packageInterest: resolvedPackage?.id ?? preselectedPackage,
      market: preselectedMarket || (resolvedPackage?.market === "taiwan" ? "taiwan" : "japan"),
      consent: true,
    },
  });

  const preferredLanguage = watch("preferredLanguage");
  const selectedPackageId = watch("packageInterest");
  const selectedPackage = useMemo(() => getSkinPackageById(selectedPackageId ?? ""), [selectedPackageId]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const selectedBudget = BUDGETS.find((budget) => budget.label === data.budget);
      const result = await submitInquiry({
        name: data.name,
        email: data.email,
        phone: data.phone,
        nationality: data.nationality,
        residenceCountry: data.residenceCountry,
        preferredLanguage: data.preferredLanguage,
        treatmentInterest: data.treatmentInterest,
        packageInterest: data.packageInterest,
        market: data.market,
        hospitalSlug: data.hospitalSlug,
        preferredDate: data.preferredDate,
        travelStartDate: data.travelStartDate,
        travelEndDate: data.travelEndDate,
        budget: data.budget,
        budgetMin: selectedBudget?.min,
        budgetMax: selectedBudget?.max,
        currency: "USD",
        message: data.message,
        hasKoreanNationalHealthInsurance: data.hasKoreanNationalHealthInsurance,
        hasKoreanAlienRegistration: data.hasKoreanAlienRegistration,
        hasOverseasKoreanResidenceReport: data.hasOverseasKoreanResidenceReport,
        sourceLanding,
        consent: data.consent,
        consentMarketing: data.consentMarketing,
      });
      setDemoMode(result.demoMode);
      setSubmitResult(result);
      setSubmitted(true);
      toast.success(result.demoMode ? "Saved locally in demo mode." : result.storage === "v1" ? "Saved to v1 lead/case flow." : t("consult.success"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to save inquiry. Check Supabase settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="grid min-h-[70vh] place-items-center bg-ink-50 px-4 py-20">
          <div className="max-w-lg rounded-lg border border-ink-200 bg-white p-8 text-center">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-md bg-teal-50 text-teal-700">
              <CheckCircle2 className="size-9" />
            </div>
            <h1 className="font-serif text-4xl text-ink-950">Inquiry saved</h1>
            <p className="mt-4 leading-7 text-ink-600">
              {submitResult?.eligible === false
                ? "Your request was saved for coordinator review, but eligibility needs manual confirmation before provider matching."
                : "Your request has been saved. A coordinator will review eligibility, package fit, and provider availability before sending quote options."}
            </p>
            <div className="mt-5 grid gap-3 text-left">
              {[
                ["1", "Eligibility and consent check"],
                ["2", "Manual provider matching for the first 100 validation leads"],
                ["3", "Separated quote: medical fee, non-medical fee, deposit, validity"],
                ["4", "Booking confirmation only after deposit and provider schedule check"],
              ].map(([step, text]) => (
                <div key={step} className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded bg-teal-700 text-xs font-bold text-white">{step}</span>
                  {text}
                </div>
              ))}
            </div>
            {submitResult?.storage && (
              <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm text-teal-800">
                Storage path: {submitResult.storage}
                {submitResult.caseId ? ` · Case ${submitResult.caseId.slice(0, 8)}` : ""}
              </p>
            )}
            {demoMode && (
              <p className="mt-4 rounded-md bg-coral-50 p-3 text-sm text-coral-800">
                Supabase environment variables are not set yet, so this was stored in local demo storage.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" className="border-ink-300" onClick={() => setSubmitted(false)}>
                Submit another
              </Button>
              <a href="/">
                <Button className="bg-teal-700 text-white hover:bg-teal-800">Back to home</Button>
              </a>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-950 py-14 text-white">
        <div className="container-wide">
          <h1 className="font-serif text-5xl">{t("consult.title")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-300">
            Submit package, market, travel window, budget, and eligibility signals for manual coordinator matching.
          </p>
        </div>
      </section>

      <section className="bg-ink-50 py-10">
        <div className="container-wide grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-ink-200 bg-white p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-7">
              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">Patient details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`${t("consult.name")} *`} error={errors.name?.message}>
                    <Input
                      {...register("name", { required: "Name is required" })}
                      placeholder="Jane Smith"
                      className={cn("h-11", errors.name && "border-destructive")}
                    />
                  </Field>
                  <Field label={`${t("consult.email")} *`} error={errors.email?.message}>
                    <Input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      placeholder="jane@example.com"
                      className={cn("h-11", errors.email && "border-destructive")}
                    />
                  </Field>
                  <Field label={t("consult.phone")}>
                    <Input {...register("phone")} placeholder="+1 555 0100" className="h-11" />
                  </Field>
                  <Field label={t("consult.nationality")}>
                    <Input {...register("nationality")} placeholder="United States" className="h-11" />
                  </Field>
                  <Field label="Residence country *" error={errors.residenceCountry?.message}>
                    <Input
                      {...register("residenceCountry", { required: "Residence country is required" })}
                      placeholder="Japan"
                      className={cn("h-11", errors.residenceCountry && "border-destructive")}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">Validation request</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Skin package wedge">
                    <select
                      {...register("packageInterest")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">Select package</option>
                      {SKIN_PACKAGE_SKUS.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.id} · {pkg.shortTitle}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Target market">
                    <select
                      {...register("market")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="japan">Japan</option>
                      <option value="taiwan">Taiwan</option>
                    </select>
                  </Field>
                  <Field label={t("consult.treatment")}>
                    <select
                      {...register("treatmentInterest")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">Select treatment</option>
                      {SAMPLE_TREATMENTS.map((treatment) => (
                        <option key={treatment.slug} value={treatment.slug}>
                          {getLocalizedTreatmentName(treatment, lang)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Preferred hospital">
                    <select
                      {...register("hospitalSlug")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">No preference</option>
                      {SAMPLE_HOSPITALS.map((hospital) => (
                        <option key={hospital.slug} value={hospital.slug}>
                          {getLocalizedHospitalName(hospital, lang)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("consult.date")}>
                    <Input
                      type="date"
                      {...register("preferredDate")}
                      className="h-11"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                  <Field label="Travel start">
                    <Input type="date" {...register("travelStartDate")} className="h-11" min={new Date().toISOString().split("T")[0]} />
                  </Field>
                  <Field label="Travel end">
                    <Input type="date" {...register("travelEndDate")} className="h-11" min={new Date().toISOString().split("T")[0]} />
                  </Field>
                  <Field label={t("consult.budget")}>
                    <select
                      {...register("budget")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">Select budget</option>
                      {BUDGETS.map((budget) => (
                        <option key={budget.label} value={budget.label}>
                          {budget.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {selectedPackage && (
                  <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
                    Selected package: <span className="font-semibold">{selectedPackage.title}</span> · {selectedPackage.recoveryWindow} recovery ·
                    final price confirmed after provider consultation.
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">Foreign-patient eligibility check</h2>
                <div className="grid gap-3">
                  {[
                    ["hasKoreanNationalHealthInsurance", "I currently have Korean National Health Insurance."],
                    ["hasKoreanAlienRegistration", "I have Korean alien registration."],
                    ["hasOverseasKoreanResidenceReport", "I have an overseas Korean residence report in Korea."],
                  ].map(([name, label]) => (
                    <label key={name} className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        {...register(name as keyof FormData)}
                        className="mt-1 size-4 rounded border-ink-300 accent-coral-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-ink-500">
                  If any box applies, the coordinator will manually review eligibility before matching providers.
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-sm font-semibold text-ink-800">{t("consult.language")}</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => setValue("preferredLanguage", language.code)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-semibold",
                        preferredLanguage === language.code
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-ink-200 bg-white text-ink-600",
                      )}
                    >
                      {language.nativeLabel}
                    </button>
                  ))}
                </div>
              </div>

              <Field label={t("consult.message")}>
                <Textarea
                  {...register("message")}
                  rows={5}
                  placeholder="Tell us your goals, timing, previous procedures, and any concerns."
                  className="resize-none"
                />
              </Field>

              <label className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                <input
                  type="checkbox"
                  {...register("consent", { required: true })}
                  className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                />
                I agree that Global Patient Hub may store this request and share it with relevant coordinators or
                providers for consultation follow-up.
              </label>
              <label className="flex gap-3 rounded-md border border-ink-200 bg-white p-4 text-sm text-ink-700">
                <input
                  type="checkbox"
                  {...register("consentMarketing")}
                  className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                />
                I agree to receive package updates and follow-up messages about this validation request.
              </label>

              <Button type="submit" disabled={isSubmitting} className="h-12 bg-teal-700 text-white hover:bg-teal-800">
                {isSubmitting ? "Saving..." : t("consult.submit")}
              </Button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <h2 className="font-serif text-2xl text-ink-950">Operational status</h2>
              <div className="mt-4 grid gap-3">
                <StatusItem
                  icon={Database}
                  title={isSupabaseConfigured() ? "Supabase connected" : "Demo storage active"}
                  text={isSupabaseConfigured() ? "Submissions try v1 leads/cases first, then fallback to inquiries." : "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production."}
                />
                <StatusItem icon={LockKeyhole} title="Consent captured" text="Each lead stores explicit consent and request source." />
                <StatusItem icon={Clock} title="Manual matching SLA" text="First 100 validation leads should be matched by a coordinator before automation." />
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-950 p-5 text-white">
              <MessageCircle className="mb-4 size-6 text-teal-300" />
              <h2 className="font-serif text-2xl">What happens next?</h2>
              <p className="mt-3 text-sm leading-6 text-ink-300">
                A coordinator reviews your goal, budget, and travel dates, then suggests hospitals and next documents.
              </p>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <Globe2 className="mb-4 size-6 text-teal-700" />
              <h2 className="font-serif text-2xl text-ink-950">Global routing</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Language preference, nationality, and UTM source are stored for segmentation and partner follow-up.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink-800">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function StatusItem({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-md bg-ink-50 p-3">
      <Icon className="mt-0.5 size-5 text-teal-700" />
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="mt-1 text-xs leading-5 text-ink-500">{text}</p>
      </div>
    </div>
  );
}
