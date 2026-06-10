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
  partnerAssistanceMode: string;
  partnerServices?: string[];
  partnerShareConsent?: boolean;
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

const PARTNER_ASSISTANCE_MODES = [
  { value: "platform_direct", label: "Hospital matching only" },
  { value: "partner_requested", label: "I want agency / agent support" },
  { value: "partner_originated", label: "I am already speaking with an agency or agent" },
];

const PARTNER_SERVICE_OPTIONS = [
  { value: "medical_agency", label: "Medical agency coordination" },
  { value: "personal_agent", label: "Personal agent" },
  { value: "interpreter", label: "Interpreter" },
  { value: "travel_agency", label: "Travel planning" },
  { value: "airport_pickup", label: "Airport pickup" },
  { value: "hotel_recovery", label: "Hotel / recovery support" },
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
      partnerAssistanceMode: "platform_direct",
      partnerServices: [],
      partnerShareConsent: false,
      consent: true,
    },
  });

  const preferredLanguage = watch("preferredLanguage");
  const selectedPackageId = watch("packageInterest");
  const partnerAssistanceMode = watch("partnerAssistanceMode");
  const selectedPartnerServices = watch("partnerServices") ?? [];
  const selectedPackage = useMemo(() => getSkinPackageById(selectedPackageId ?? ""), [selectedPackageId]);
  const partnerSupportRequested = partnerAssistanceMode !== "platform_direct" || selectedPartnerServices.length > 0;

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
        partnerAssistanceMode: data.partnerAssistanceMode,
        partnerServices: data.partnerServices,
        partnerShareConsent: data.partnerShareConsent,
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
      toast.success(result.demoMode ? t("consult.localSaved") : result.storage === "v1" ? t("consult.v1Saved") : t("consult.success"));
    } catch (error) {
      console.error(error);
      toast.error(t("consult.failedSave"));
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
            <h1 className="font-serif text-4xl text-ink-950">{t("consult.savedTitle")}</h1>
            <p className="mt-4 leading-7 text-ink-600">
              {submitResult?.eligible === false
                ? t("consult.savedEligibilityReview")
                : t("consult.savedReview")}
            </p>
            <div className="mt-5 grid gap-3 text-left">
              {[
                ["1", t("consult.next.1")],
                ["2", t("consult.next.2")],
                ["3", t("consult.next.3")],
                ["4", t("consult.next.4")],
              ].map(([step, text]) => (
                <div key={step} className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded bg-teal-700 text-xs font-bold text-white">{step}</span>
                  {text}
                </div>
              ))}
            </div>
            {submitResult?.storage && (
              <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm text-teal-800">
                {t("consult.storagePath")} {submitResult.storage}
                {submitResult.caseId ? ` · Case ${submitResult.caseId.slice(0, 8)}` : ""}
              </p>
            )}
            {demoMode && (
              <p className="mt-4 rounded-md bg-coral-50 p-3 text-sm text-coral-800">
                {t("consult.demoStorage")}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" className="border-ink-300" onClick={() => setSubmitted(false)}>
                {t("consult.submitAnother")}
              </Button>
              <a href="/">
                <Button className="bg-teal-700 text-white hover:bg-teal-800">{t("consult.backHome")}</Button>
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
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-300">{t("consult.subtitle")}</p>
        </div>
      </section>

      <section className="bg-ink-50 py-10">
        <div className="container-wide grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-ink-200 bg-white p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-7">
              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">{t("consult.patientDetails")}</h2>
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
                  <Field label={`${t("consult.residenceCountry")} *`} error={errors.residenceCountry?.message}>
                    <Input
                      {...register("residenceCountry", { required: "Residence country is required" })}
                      placeholder="Japan"
                      className={cn("h-11", errors.residenceCountry && "border-destructive")}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">{t("consult.validationRequest")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("consult.packageWedge")}>
                    <select
                      {...register("packageInterest")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">{t("consult.selectPackage")}</option>
                      {SKIN_PACKAGE_SKUS.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.id} · {pkg.shortTitle}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("consult.targetMarket")}>
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
                      <option value="">{t("consult.selectTreatment")}</option>
                      {SAMPLE_TREATMENTS.map((treatment) => (
                        <option key={treatment.slug} value={treatment.slug}>
                          {getLocalizedTreatmentName(treatment, lang)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("consult.preferredHospital")}>
                    <select
                      {...register("hospitalSlug")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">{t("consult.noPreference")}</option>
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
                  <Field label={t("consult.travelStart")}>
                    <Input type="date" {...register("travelStartDate")} className="h-11" min={new Date().toISOString().split("T")[0]} />
                  </Field>
                  <Field label={t("consult.travelEnd")}>
                    <Input type="date" {...register("travelEndDate")} className="h-11" min={new Date().toISOString().split("T")[0]} />
                  </Field>
                  <Field label={t("consult.budget")}>
                    <select
                      {...register("budget")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="">{t("consult.selectBudget")}</option>
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
                    {t("consult.selectedPackagePrefix")} <span className="font-semibold">{selectedPackage.title}</span> -{" "}
                    {selectedPackage.recoveryWindow} {t("consult.selectedPackageSuffix")}
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">{t("consult.eligibilityTitle")}</h2>
                <div className="grid gap-3">
                  {[
                    ["hasKoreanNationalHealthInsurance", t("consult.eligibility.nhi")],
                    ["hasKoreanAlienRegistration", t("consult.eligibility.alien")],
                    ["hasOverseasKoreanResidenceReport", t("consult.eligibility.overseas")],
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
                  {t("consult.eligibilityHelp")}
                </p>
              </div>

              <div>
                <h2 className="mb-4 font-serif text-3xl text-ink-950">Partner support request</h2>
                <div className="grid gap-4">
                  <Field label="How would you like to be supported?">
                    <select
                      {...register("partnerAssistanceMode")}
                      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      {PARTNER_ASSISTANCE_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div>
                    <Label className="mb-3 block text-sm font-semibold text-ink-800">Optional partner services</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PARTNER_SERVICE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                          <input
                            type="checkbox"
                            value={option.value}
                            {...register("partnerServices")}
                            className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {partnerSupportRequested && (
                    <label className="flex gap-3 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                      <input
                        type="checkbox"
                        {...register("partnerShareConsent")}
                        className="mt-1 size-4 rounded border-teal-300 accent-teal-700"
                      />
                      I agree that Global Patient Hub may share the minimum necessary case, travel, and contact details with assigned partner operators for the selected non-medical services.
                    </label>
                  )}
                </div>
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
                  placeholder={t("consult.messagePlaceholder")}
                  className="resize-none"
                />
              </Field>

              <label className="flex gap-3 rounded-md border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
                <input
                  type="checkbox"
                  {...register("consent", { required: true })}
                  className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                />
                {t("consult.consent")}
              </label>
              <label className="flex gap-3 rounded-md border border-ink-200 bg-white p-4 text-sm text-ink-700">
                <input
                  type="checkbox"
                  {...register("consentMarketing")}
                  className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                />
                {t("consult.marketingConsent")}
              </label>

              <Button type="submit" disabled={isSubmitting} className="h-12 bg-teal-700 text-white hover:bg-teal-800">
                {isSubmitting ? t("consult.saving") : t("consult.submit")}
              </Button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <h2 className="font-serif text-2xl text-ink-950">{t("consult.operationalStatus")}</h2>
              <div className="mt-4 grid gap-3">
                <StatusItem
                  icon={Database}
                  title={isSupabaseConfigured() ? t("consult.supabaseConnected") : t("consult.demoStorageActive")}
                  text={isSupabaseConfigured() ? t("consult.supabaseConnectedText") : t("consult.demoStorageActiveText")}
                />
                <StatusItem icon={LockKeyhole} title={t("consult.consentCaptured")} text={t("consult.consentCapturedText")} />
                <StatusItem icon={Clock} title={t("consult.manualMatchingSla")} text={t("consult.manualMatchingSlaText")} />
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-950 p-5 text-white">
              <MessageCircle className="mb-4 size-6 text-teal-300" />
              <h2 className="font-serif text-2xl">{t("consult.whatNext")}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-300">{t("consult.whatNextCopy")}</p>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <Globe2 className="mb-4 size-6 text-teal-700" />
              <h2 className="font-serif text-2xl text-ink-950">{t("consult.globalRouting")}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">{t("consult.globalRoutingCopy")}</p>
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
