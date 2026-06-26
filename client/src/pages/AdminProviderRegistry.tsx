import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import {
  Database,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { betaProviders, type BetaProviderCandidate } from "@/lib/betaData";
import { languageListLabel } from "@/lib/adminLabels";
import {
  LANDING_LOCALE_OPTIONS,
  LANDING_MARKET_OPTIONS,
} from "@/lib/landingRouteOptions";
import {
  createProviderMvp,
  deleteProviderMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  updateProviderMvp,
  type AdminProviderInput,
  type ProviderOperatingProfile,
  type ProviderPublicDoctor,
  type ProviderPublicMedia,
  type ProviderPublicProfile,
  type ProviderPublicProfileI18n,
  type ProviderPublicProfileInput,
  type ProviderPublicStatus,
  type ProviderPublicTreatment,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

type RegistryStatus = "loading" | "ready" | "saving" | "deleting" | "error";

const languageOptions = LANDING_LOCALE_OPTIONS.map(option => ({
  value: option.code === "jp" ? "ja" : option.code,
  label: `${option.labelKo} (${option.code === "jp" ? "ja" : option.code})`,
})).filter(
  (option, index, options) =>
    options.findIndex(item => item.value === option.value) === index
);
const marketOptions = LANDING_MARKET_OPTIONS.map(option => ({
  value: option.code,
  label: `${option.labelKo} (${option.code})`,
}));
const controlClassName =
  "h-9 w-full border-ink-200 bg-white text-sm text-ink-900 shadow-none";
const selectClassName =
  "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15";
const textareaClassName =
  "h-20 min-h-20 w-full resize-none border-ink-200 bg-white text-sm text-ink-900 shadow-none";

const facilityOptions: Array<{
  value: AdminProviderInput["facilityType"];
  label: string;
}> = [
  { value: "clinic", label: "의원" },
  { value: "hospital", label: "병원" },
  { value: "general_hospital", label: "종합병원" },
  { value: "tertiary_hospital", label: "상급종합병원" },
];

const exposureOptions: Array<{
  value: AdminProviderInput["publicExposureStatus"];
  label: string;
}> = [
  { value: "blocked", label: "차단" },
  { value: "candidate", label: "후보" },
  { value: "ready", label: "준비 완료" },
  { value: "published", label: "공개" },
];

const dataSourceOptions: Array<{
  value: AdminProviderInput["dataSourceStatus"];
  label: string;
}> = [
  { value: "candidate", label: "후보" },
  { value: "verified_docs", label: "서류 확인" },
  { value: "contracted", label: "계약 완료" },
  { value: "demo_seed", label: "데모" },
];

const slaStatusOptions: Array<{
  value: AdminProviderInput["slaContractStatus"];
  label: string;
}> = [
  { value: "draft", label: "초안" },
  { value: "sent", label: "발송" },
  { value: "negotiating", label: "협의" },
  { value: "pending_docs", label: "서류 대기" },
  { value: "signed", label: "서명 완료" },
];

const publicStatusOptions: Array<{
  value: ProviderPublicStatus;
  label: string;
}> = [
  { value: "draft", label: "초안" },
  { value: "review_requested", label: "검수 요청" },
  { value: "ready", label: "공개 준비" },
  { value: "published", label: "공개" },
  { value: "paused", label: "비공개" },
];

const publicLocaleOptions = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
] as const;

function createDefaultPublicProfile(): ProviderPublicProfileInput {
  return {
    slug: "",
    status: "draft",
    specialty: "dermatology",
    region: "gangnam",
    phonePublic: "",
    websiteUrl: "",
    priceTier: "$$",
    rating: 0,
    reviewCount: 0,
    latitude: null,
    longitude: null,
    featured: false,
    i18n: [
      {
        locale: "ko",
        name: "",
        summary: "",
        description: "",
        address: "",
        specialties: [],
        highlights: [],
      },
      {
        locale: "en",
        name: "",
        summary: "",
        description: "",
        address: "",
        specialties: [],
        highlights: [],
      },
    ],
    media: [],
    doctors: [],
    treatments: [],
  };
}

function createDefaultProviderDraft(): AdminProviderInput {
  return {
    nameLegal: "",
    nameDisplayKo: "",
    nameDisplayEn: "",
    opsEmail: "",
    facilityType: "clinic",
    address: "",
    city: "Seoul",
    district: "Gangnam",
    countryCode: "KR",
    medicalKoreaRegistered: false,
    active: true,
    defaultCommissionCapRate: 0.3,
    qualityScore: 70,
    publicExposureStatus: "candidate",
    dataSourceStatus: "candidate",
    supportedMarkets: ["japan", "taiwan"],
    supportedLanguages: ["ko", "en"],
    standardSlaHours: 24,
    urgentSlaHours: 6,
    priceRangeUsdMin: null,
    priceRangeUsdMax: null,
    quoteTemplateReady: false,
    depositPolicyReady: false,
    slaContractStatus: "draft",
    verificationSummary: "",
    sourceNotes: "",
    publicProfile: createDefaultPublicProfile(),
    nextStep: "검증 서류 확인",
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter(item => item !== value)
    : [...values, value];
}

function toPercent(value: number) {
  return Math.round(value * 1000) / 10;
}

function fromPercent(value: string) {
  return Number(value) / 100;
}

function splitListText(value: string) {
  return value
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function joinListText(values?: string[]) {
  return values?.join("\n") ?? "";
}

function mediaRowsToText(rows: ProviderPublicMedia[]) {
  return rows
    .filter(row => row.mediaType !== "cover")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(row => row.publicUrl || row.storagePath || "")
    .filter(Boolean)
    .join("\n");
}

function mediaRowsFromText(value: string, current: ProviderPublicMedia[]) {
  const cover = current.filter(row => row.mediaType === "cover");
  const gallery = splitListText(value).map((url, index) => ({
    mediaType: "gallery" as const,
    publicUrl: url,
    storagePath: "",
    altText: "",
    displayOrder: index + 1,
    active: true,
  }));
  return [...cover, ...gallery];
}

function coverUrl(profile?: ProviderPublicProfileInput) {
  return (
    profile?.media.find(row => row.mediaType === "cover")?.publicUrl ||
    profile?.media.find(row => row.mediaType === "cover")?.storagePath ||
    ""
  );
}

function updateCoverUrl(profile: ProviderPublicProfileInput, url: string) {
  const otherRows = profile.media.filter(row => row.mediaType !== "cover");
  const coverRows = url.trim()
    ? [
        {
          mediaType: "cover" as const,
          publicUrl: url.trim(),
          storagePath: "",
          altText: profile.i18n[0]?.name || "",
          displayOrder: 0,
          active: true,
        },
      ]
    : [];
  return [...coverRows, ...otherRows];
}

function doctorsToText(rows: ProviderPublicDoctor[]) {
  return rows
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(row =>
      [
        row.name,
        row.title || "",
        row.specialty || "",
        row.yearsExperience ?? "",
        row.bio || "",
        row.photoUrl || "",
      ].join(" | ")
    )
    .join("\n");
}

function doctorsFromText(value: string): ProviderPublicDoctor[] {
  return value
    .split("\n")
    .map((line, index) => {
      const [name, title, specialty, years, bio, photoUrl] = line
        .split("|")
        .map(item => item.trim());
      if (!name) return null;
      return {
        name,
        title,
        specialty,
        bio,
        photoUrl,
        yearsExperience: years ? Number(years) : null,
        displayOrder: index,
        active: true,
      };
    })
    .filter(Boolean) as ProviderPublicDoctor[];
}

function treatmentsToText(rows: ProviderPublicTreatment[]) {
  return rows
    .map(row =>
      [
        row.title,
        row.priceMinKrw ?? "",
        row.priceMaxKrw ?? "",
        row.recoveryDays ?? "",
        row.durationMinutes ?? "",
        row.notes || "",
        row.treatmentSlug || "",
      ].join(" | ")
    )
    .join("\n");
}

function treatmentsFromText(value: string): ProviderPublicTreatment[] {
  return value
    .split("\n")
    .map(line => {
      const [
        title,
        priceMin,
        priceMax,
        recoveryDays,
        durationMinutes,
        notes,
        slug,
      ] = line.split("|").map(item => item.trim());
      if (!title) return null;
      return {
        title,
        priceMinKrw: priceMin ? Number(priceMin) : null,
        priceMaxKrw: priceMax ? Number(priceMax) : null,
        recoveryDays: recoveryDays ? Number(recoveryDays) : null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        notes,
        treatmentSlug: slug,
        active: true,
      };
    })
    .filter(Boolean) as ProviderPublicTreatment[];
}

function normalizeFacilityType(
  value?: string
): AdminProviderInput["facilityType"] {
  return facilityOptions.some(option => option.value === value)
    ? (value as AdminProviderInput["facilityType"])
    : "clinic";
}

function publicProfileToDraft({
  provider,
  publicProfile,
  i18n,
  media,
  doctors,
  treatments,
}: {
  provider: BetaProviderCandidate;
  publicProfile?: ProviderPublicProfile;
  i18n: ProviderPublicProfileI18n[];
  media: ProviderPublicMedia[];
  doctors: ProviderPublicDoctor[];
  treatments: ProviderPublicTreatment[];
}): ProviderPublicProfileInput {
  const fallback = createDefaultPublicProfile();
  const existingLocales = new Set(i18n.map(row => row.locale));
  const normalizedI18n = [
    ...i18n,
    ...fallback.i18n
      .filter(row => !existingLocales.has(row.locale))
      .map(row => ({
        ...row,
        name:
          row.locale === "ko"
            ? provider.nameDisplayKo || provider.name
            : provider.nameDisplayEn || provider.name,
        address: provider.address || "",
      })),
  ];

  return {
    ...fallback,
    slug: publicProfile?.slug ?? "",
    status: publicProfile?.status ?? "draft",
    specialty:
      publicProfile?.specialty ??
      provider.specialty?.toLowerCase() ??
      "dermatology",
    region:
      publicProfile?.region ?? provider.region?.toLowerCase() ?? "gangnam",
    phonePublic: publicProfile?.phonePublic ?? "",
    websiteUrl: publicProfile?.websiteUrl ?? "",
    priceTier: publicProfile?.priceTier ?? "$$",
    rating: publicProfile?.rating ?? 0,
    reviewCount: publicProfile?.reviewCount ?? 0,
    latitude: publicProfile?.latitude ?? null,
    longitude: publicProfile?.longitude ?? null,
    featured: publicProfile?.featured ?? false,
    i18n: normalizedI18n,
    media,
    doctors,
    treatments,
  };
}

function providerToDraft(
  provider: BetaProviderCandidate,
  profile?: ProviderOperatingProfile,
  publicProfile?: ProviderPublicProfile,
  i18n: ProviderPublicProfileI18n[] = [],
  media: ProviderPublicMedia[] = [],
  doctors: ProviderPublicDoctor[] = [],
  treatments: ProviderPublicTreatment[] = []
): AdminProviderInput {
  return {
    ...createDefaultProviderDraft(),
    nameLegal: provider.nameLegal || provider.name,
    nameDisplayKo: provider.nameDisplayKo || provider.name,
    nameDisplayEn: provider.nameDisplayEn || provider.name,
    opsEmail: provider.opsEmail || "",
    facilityType: normalizeFacilityType(
      provider.facilityType || provider.specialty
    ),
    address: provider.address || "",
    city: provider.city || "Seoul",
    district: provider.district || provider.region || "",
    countryCode: provider.countryCode || "KR",
    medicalKoreaRegistered:
      provider.medicalKoreaRegistered ?? provider.registrationVerified,
    active: provider.active,
    defaultCommissionCapRate: provider.defaultCommissionCapRate ?? 0.3,
    qualityScore: provider.qualityScore ?? provider.betaScore,
    publicExposureStatus: profile?.publicExposureStatus ?? "candidate",
    dataSourceStatus: profile?.dataSourceStatus ?? "candidate",
    supportedMarkets: profile?.supportedMarkets?.length
      ? profile.supportedMarkets
      : ["japan", "taiwan"],
    supportedLanguages: profile?.supportedLanguages?.length
      ? profile.supportedLanguages
      : provider.languages,
    standardSlaHours: profile?.standardSlaHours ?? provider.slaHours,
    urgentSlaHours: profile?.urgentSlaHours ?? provider.urgentSlaHours,
    priceRangeUsdMin: profile?.priceRangeUsdMin ?? null,
    priceRangeUsdMax: profile?.priceRangeUsdMax ?? null,
    quoteTemplateReady:
      profile?.quoteTemplateReady ?? provider.quoteTemplateReady,
    depositPolicyReady:
      profile?.depositPolicyReady ?? provider.depositPolicyReady,
    slaContractStatus: profile?.slaContractStatus ?? provider.slaStatus,
    verificationSummary: profile?.verificationSummary ?? "",
    sourceNotes: profile?.sourceNotes ?? "",
    nextStep: profile?.nextStep ?? provider.nextStep,
    publicProfile: publicProfileToDraft({
      provider,
      publicProfile,
      i18n,
      media,
      doctors,
      treatments,
    }),
  };
}

export default function AdminProviderRegistry() {
  const [draft, setDraft] = useState<AdminProviderInput>(() =>
    createDefaultProviderDraft()
  );
  const [editingProviderId, setEditingProviderId] = useState<string | null>(
    null
  );
  const [providers, setProviders] =
    useState<BetaProviderCandidate[]>(betaProviders);
  const [profiles, setProfiles] = useState<ProviderOperatingProfile[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<ProviderPublicProfile[]>(
    []
  );
  const [publicI18n, setPublicI18n] = useState<ProviderPublicProfileI18n[]>([]);
  const [publicMedia, setPublicMedia] = useState<ProviderPublicMedia[]>([]);
  const [publicDoctors, setPublicDoctors] = useState<ProviderPublicDoctor[]>(
    []
  );
  const [publicTreatments, setPublicTreatments] = useState<
    ProviderPublicTreatment[]
  >([]);
  const [status, setStatus] = useState<RegistryStatus>("loading");
  const [message, setMessage] = useState("병원 목록을 불러오는 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());
  const providerFormRef = useRef<HTMLFormElement | null>(null);

  const profileByProviderId = useMemo(
    () => new Map(profiles.map(profile => [profile.providerId, profile])),
    [profiles]
  );
  const publicProfileByProviderId = useMemo(
    () => new Map(publicProfiles.map(profile => [profile.providerId, profile])),
    [publicProfiles]
  );
  const publicI18nByProviderId = useMemo(() => {
    const map = new Map<string, ProviderPublicProfileI18n[]>();
    for (const row of publicI18n) {
      if (!row.providerId) continue;
      const rows = map.get(row.providerId) ?? [];
      rows.push(row);
      map.set(row.providerId, rows);
    }
    return map;
  }, [publicI18n]);
  const publicMediaByProviderId = useMemo(() => {
    const map = new Map<string, ProviderPublicMedia[]>();
    for (const row of publicMedia) {
      if (!row.providerId) continue;
      const rows = map.get(row.providerId) ?? [];
      rows.push(row);
      map.set(row.providerId, rows);
    }
    return map;
  }, [publicMedia]);
  const publicDoctorsByProviderId = useMemo(() => {
    const map = new Map<string, ProviderPublicDoctor[]>();
    for (const row of publicDoctors) {
      if (!row.providerId) continue;
      const rows = map.get(row.providerId) ?? [];
      rows.push(row);
      map.set(row.providerId, rows);
    }
    return map;
  }, [publicDoctors]);
  const publicTreatmentsByProviderId = useMemo(() => {
    const map = new Map<string, ProviderPublicTreatment[]>();
    for (const row of publicTreatments) {
      if (!row.providerId) continue;
      const rows = map.get(row.providerId) ?? [];
      rows.push(row);
      map.set(row.providerId, rows);
    }
    return map;
  }, [publicTreatments]);
  const activeCount = providers.filter(provider => provider.active).length;
  const readyCount = profiles.filter(
    profile =>
      profile.publicExposureStatus === "ready" ||
      profile.publicExposureStatus === "published"
  ).length;
  const isBusy = status === "saving" || status === "deleting";

  function resetForm() {
    setDraft(createDefaultProviderDraft());
    setEditingProviderId(null);
  }

  function applySnapshot(
    snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>
  ) {
    setProviders(snapshot.providers);
    setProfiles(snapshot.providerOperatingProfiles ?? []);
    setPublicProfiles(snapshot.providerPublicProfiles ?? []);
    setPublicI18n(snapshot.providerPublicProfileI18n ?? []);
    setPublicMedia(snapshot.providerPublicMedia ?? []);
    setPublicDoctors(snapshot.providerPublicDoctors ?? []);
    setPublicTreatments(snapshot.providerPublicTreatments ?? []);
  }

  async function refreshProviders() {
    if (!adminToken) {
      setStatus("error");
      setMessage("운영 이메일 인증 세션이 필요합니다.");
      return;
    }

    try {
      setStatus("loading");
      const snapshot = await fetchPartnerMvpSnapshot(adminToken, {
        force: true,
      });
      applySnapshot(snapshot);
      setStatus("ready");
      setMessage(`병원 ${snapshot.providers.length}곳을 불러왔습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "병원 목록을 불러오지 못했습니다."
      );
    }
  }

  useEffect(() => {
    void refreshProviders();
  }, []);

  const updateDraft = <K extends keyof AdminProviderInput>(
    key: K,
    value: AdminProviderInput[K]
  ) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const updatePublicDraft = <K extends keyof ProviderPublicProfileInput>(
    key: K,
    value: ProviderPublicProfileInput[K]
  ) => {
    setDraft(current => ({
      ...current,
      publicProfile: {
        ...(current.publicProfile ?? createDefaultPublicProfile()),
        [key]: value,
      },
    }));
  };

  function updatePublicLocale(
    locale: ProviderPublicProfileI18n["locale"],
    patch: Partial<ProviderPublicProfileI18n>
  ) {
    setDraft(current => {
      const publicProfile =
        current.publicProfile ?? createDefaultPublicProfile();
      const existing = publicProfile.i18n.find(row => row.locale === locale);
      const nextRow = {
        locale,
        name: "",
        summary: "",
        description: "",
        address: "",
        specialties: [],
        highlights: [],
        ...(existing ?? {}),
        ...patch,
      };
      return {
        ...current,
        publicProfile: {
          ...publicProfile,
          i18n: [
            ...publicProfile.i18n.filter(row => row.locale !== locale),
            nextRow,
          ],
        },
      };
    });
  }

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) return;
    if (
      !draft.nameLegal.trim() ||
      !draft.nameDisplayKo.trim() ||
      !draft.address.trim()
    ) {
      setStatus("error");
      setMessage("법인명, 표시명, 주소는 필수입니다.");
      return;
    }

    try {
      setStatus("saving");
      const snapshot = editingProviderId
        ? await updateProviderMvp(adminToken, editingProviderId, draft)
        : await createProviderMvp(adminToken, draft);
      applySnapshot(snapshot);
      resetForm();
      setStatus("ready");
      setMessage(
        editingProviderId
          ? "병원 정보를 수정했습니다."
          : "신규 병원을 등록했습니다."
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "병원 저장에 실패했습니다."
      );
    }
  }

  function startEdit(provider: BetaProviderCandidate) {
    setDraft(
      providerToDraft(
        provider,
        profileByProviderId.get(provider.id),
        publicProfileByProviderId.get(provider.id),
        publicI18nByProviderId.get(provider.id) ?? [],
        publicMediaByProviderId.get(provider.id) ?? [],
        publicDoctorsByProviderId.get(provider.id) ?? [],
        publicTreatmentsByProviderId.get(provider.id) ?? []
      )
    );
    setEditingProviderId(provider.id);
    setStatus("ready");
    setMessage(`${provider.name} 정보를 수정 중입니다.`);
    window.requestAnimationFrame(() => {
      providerFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function removeProvider(provider: BetaProviderCandidate) {
    if (!adminToken) return;
    if (
      !window.confirm(
        `${provider.name} 병원을 삭제할까요? 목록과 접근 권한에서 비활성화됩니다.`
      )
    )
      return;

    try {
      setStatus("deleting");
      const snapshot = await deleteProviderMvp(adminToken, provider.id);
      applySnapshot(snapshot);
      if (editingProviderId === provider.id) resetForm();
      setStatus("ready");
      setMessage(`${provider.name} 병원을 삭제했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "병원 삭제에 실패했습니다."
      );
    }
  }

  const publicDraft = draft.publicProfile ?? createDefaultPublicProfile();

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ShieldCheck className="size-4" />
                관리자 전용
              </div>
              <h1 className="font-serif text-4xl text-ink-950 md:text-5xl">
                병원 등록
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
                병원 기본 정보, 운영 이메일 인증, 노출 상태, SLA, 가격 범위를
                관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 border-ink-300 text-ink-800"
                onClick={() => void refreshProviders()}
                disabled={status === "loading"}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    status === "loading" && "animate-spin"
                  )}
                />
                새로고침
              </Button>
              <Link href="/admin/partners">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-ink-300 text-ink-800"
                >
                  에이전트 등록
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Metric label="등록 병원" value={providers.length} />
            <Metric label="활성 병원" value={activeCount} />
            <Metric label="노출 준비" value={readyCount} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-6">
          <form
            ref={providerFormRef}
            onSubmit={submitProvider}
            className="order-2 rounded-lg border border-ink-200 bg-ink-50 p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {editingProviderId ? (
                  <Pencil className="size-5 text-teal-700" />
                ) : (
                  <Plus className="size-5 text-teal-700" />
                )}
                <h2 className="font-serif text-2xl text-ink-950">
                  {editingProviderId ? "병원 정보 수정" : "신규 병원 입력"}
                </h2>
              </div>
              {editingProviderId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-ink-600"
                  onClick={resetForm}
                >
                  <RotateCcw className="size-4" />
                  취소
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="법인명" span="full">
                <Input
                  className={controlClassName}
                  value={draft.nameLegal}
                  onChange={event =>
                    updateDraft("nameLegal", event.target.value)
                  }
                  placeholder="ABC Dermatology Clinic"
                />
              </Field>
              <Field label="표시명(한국어)">
                <Input
                  className={controlClassName}
                  value={draft.nameDisplayKo}
                  onChange={event =>
                    updateDraft("nameDisplayKo", event.target.value)
                  }
                  placeholder="ABC 피부과"
                />
              </Field>
              <Field label="표시명(영어)">
                <Input
                  className={controlClassName}
                  value={draft.nameDisplayEn ?? ""}
                  onChange={event =>
                    updateDraft("nameDisplayEn", event.target.value)
                  }
                  placeholder="ABC Dermatology"
                />
              </Field>
              <Field label="운영 인증 이메일" span="full">
                <Input
                  className={controlClassName}
                  type="email"
                  value={draft.opsEmail ?? ""}
                  onChange={event =>
                    updateDraft("opsEmail", event.target.value)
                  }
                  placeholder="hospital-ops@example.com"
                />
              </Field>
              <Field label="기관 유형">
                <select
                  value={draft.facilityType}
                  onChange={event =>
                    updateDraft(
                      "facilityType",
                      event.target.value as AdminProviderInput["facilityType"]
                    )
                  }
                  className={selectClassName}
                >
                  {facilityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="도시">
                <Input
                  className={controlClassName}
                  value={draft.city}
                  onChange={event => updateDraft("city", event.target.value)}
                />
              </Field>
              <Field label="구/지역">
                <Input
                  className={controlClassName}
                  value={draft.district ?? ""}
                  onChange={event =>
                    updateDraft("district", event.target.value)
                  }
                />
              </Field>
              <Field label="국가 코드">
                <Input
                  className={controlClassName}
                  value={draft.countryCode}
                  onChange={event =>
                    updateDraft(
                      "countryCode",
                      event.target.value.toUpperCase().slice(0, 2)
                    )
                  }
                />
              </Field>
              <Field label="주소" span="full">
                <Input
                  className={controlClassName}
                  value={draft.address}
                  onChange={event => updateDraft("address", event.target.value)}
                  placeholder="Seoul, Gangnam-gu ..."
                />
              </Field>

              <OptionGroup
                label="지원 언어"
                values={languageOptions}
                selected={draft.supportedLanguages}
                onToggle={value =>
                  updateDraft(
                    "supportedLanguages",
                    toggleValue(draft.supportedLanguages, value)
                  )
                }
              />
              <OptionGroup
                label="지원 시장"
                values={marketOptions}
                selected={draft.supportedMarkets}
                onToggle={value =>
                  updateDraft(
                    "supportedMarkets",
                    toggleValue(draft.supportedMarkets, value)
                  )
                }
              />

              <Field label="표준 SLA(시간)">
                <Input
                  className={controlClassName}
                  type="number"
                  min={1}
                  value={draft.standardSlaHours}
                  onChange={event =>
                    updateDraft("standardSlaHours", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="긴급 SLA(시간)">
                <Input
                  className={controlClassName}
                  type="number"
                  min={1}
                  value={draft.urgentSlaHours}
                  onChange={event =>
                    updateDraft("urgentSlaHours", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="품질 점수">
                <Input
                  className={controlClassName}
                  type="number"
                  min={0}
                  max={100}
                  value={draft.qualityScore}
                  onChange={event =>
                    updateDraft("qualityScore", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="수수료 상한(%)">
                <Input
                  className={controlClassName}
                  type="number"
                  min={0}
                  max={30}
                  step={0.1}
                  value={toPercent(draft.defaultCommissionCapRate)}
                  onChange={event =>
                    updateDraft(
                      "defaultCommissionCapRate",
                      fromPercent(event.target.value)
                    )
                  }
                />
              </Field>

              <Field label="노출 상태">
                <select
                  value={draft.publicExposureStatus}
                  onChange={event =>
                    updateDraft(
                      "publicExposureStatus",
                      event.target
                        .value as AdminProviderInput["publicExposureStatus"]
                    )
                  }
                  className={selectClassName}
                >
                  {exposureOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="자료 상태">
                <select
                  value={draft.dataSourceStatus}
                  onChange={event =>
                    updateDraft(
                      "dataSourceStatus",
                      event.target
                        .value as AdminProviderInput["dataSourceStatus"]
                    )
                  }
                  className={selectClassName}
                >
                  {dataSourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="SLA 계약">
                <select
                  value={draft.slaContractStatus}
                  onChange={event =>
                    updateDraft(
                      "slaContractStatus",
                      event.target
                        .value as AdminProviderInput["slaContractStatus"]
                    )
                  }
                  className={selectClassName}
                >
                  {slaStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="가격 하한(USD)">
                <Input
                  className={controlClassName}
                  type="number"
                  min={0}
                  value={draft.priceRangeUsdMin ?? ""}
                  onChange={event =>
                    updateDraft(
                      "priceRangeUsdMin",
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                />
              </Field>
              <Field label="가격 상한(USD)">
                <Input
                  className={controlClassName}
                  type="number"
                  min={0}
                  value={draft.priceRangeUsdMax ?? ""}
                  onChange={event =>
                    updateDraft(
                      "priceRangeUsdMax",
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                />
              </Field>

              <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                <Check
                  label="Medical Korea 등록 확인"
                  checked={draft.medicalKoreaRegistered}
                  onChange={checked =>
                    updateDraft("medicalKoreaRegistered", checked)
                  }
                />
                <Check
                  label="활성 병원"
                  checked={draft.active}
                  onChange={checked => updateDraft("active", checked)}
                />
                <Check
                  label="견적 템플릿 준비"
                  checked={draft.quoteTemplateReady}
                  onChange={checked =>
                    updateDraft("quoteTemplateReady", checked)
                  }
                />
                <Check
                  label="예약금 정책 준비"
                  checked={draft.depositPolicyReady}
                  onChange={checked =>
                    updateDraft("depositPolicyReady", checked)
                  }
                />
              </div>

              <Field label="다음 액션" span="full">
                <Input
                  className={controlClassName}
                  value={draft.nextStep ?? ""}
                  onChange={event =>
                    updateDraft("nextStep", event.target.value)
                  }
                />
              </Field>
              <Field label="검증 메모" span="full">
                <Textarea
                  className={textareaClassName}
                  value={draft.verificationSummary ?? ""}
                  onChange={event =>
                    updateDraft("verificationSummary", event.target.value)
                  }
                />
              </Field>

              <PublicCmsFields
                publicDraft={publicDraft}
                updatePublicDraft={updatePublicDraft}
                updatePublicLocale={updatePublicLocale}
              />

              <Button
                type="submit"
                disabled={isBusy}
                className="h-9 bg-teal-700 text-sm text-white hover:bg-teal-800 md:col-span-2"
              >
                <Save className="size-4" />
                {status === "saving"
                  ? "저장 중"
                  : editingProviderId
                    ? "수정 저장"
                    : "병원 등록"}
              </Button>
            </div>
          </form>

          <div className="order-1 min-w-0">
            <div
              className={cn(
                "mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm",
                status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-teal-200 bg-teal-50 text-teal-900"
              )}
            >
              <Database className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold">저장 상태</div>
                <div className="mt-1">{message}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-ink-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">병원</th>
                    <th className="px-4 py-3 font-semibold">언어/SLA</th>
                    <th className="px-4 py-3 font-semibold">운영 상태</th>
                    <th className="px-4 py-3 font-semibold">품질</th>
                    <th className="px-4 py-3 text-right font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {providers.map(provider => {
                    const profile = profileByProviderId.get(provider.id);
                    const isEditing = editingProviderId === provider.id;
                    return (
                      <tr
                        key={provider.id}
                        className={cn(isEditing && "bg-teal-50/60")}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-950">
                            {provider.name}
                          </div>
                          <div className="mt-1 text-xs text-ink-500">
                            {provider.region} / {provider.specialty}
                          </div>
                          {provider.opsEmail ? (
                            <div className="mt-1 text-xs text-ink-500">
                              {provider.opsEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {languageListLabel(provider.languages)}
                          <div className="mt-1 text-xs text-ink-500">
                            표준 {provider.slaHours}h / 긴급{" "}
                            {provider.urgentSlaHours}h
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700">
                            {profile?.publicExposureStatus ?? "candidate"}
                          </span>
                          <div className="mt-1 text-xs text-ink-500">
                            {provider.active ? "활성" : "비활성"} /{" "}
                            {provider.nextStep}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink-950">
                          {provider.betaScore}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 border-ink-200 px-2 text-xs"
                              onClick={() => startEdit(provider)}
                              disabled={isBusy}
                            >
                              <Pencil className="size-3.5" />
                              수정
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 border-rose-200 px-2 text-xs text-rose-700 hover:bg-rose-50"
                              onClick={() => void removeProvider(provider)}
                              disabled={isBusy}
                            >
                              <Trash2 className="size-3.5" />
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="text-sm font-semibold text-ink-500">{label}</div>
      <div className="mt-1 font-serif text-3xl text-ink-950">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: ReactNode;
  span?: "full";
}) {
  return (
    <label
      className={cn("grid min-w-0 gap-1.5", span === "full" && "md:col-span-2")}
    >
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function OptionGroup({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs font-semibold text-ink-700">{label}</div>
      <div className="flex min-h-9 flex-wrap gap-1.5">
        {values.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={cn(
              "min-h-8 rounded-md border px-2.5 py-1 text-xs font-semibold",
              selected.includes(option.value)
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="size-4 rounded border-ink-300 accent-teal-700"
      />
      <span className="font-semibold">{label}</span>
    </label>
  );
}

function PublicCmsFields({
  publicDraft,
  updatePublicDraft,
  updatePublicLocale,
}: {
  publicDraft: ProviderPublicProfileInput;
  updatePublicDraft: <K extends keyof ProviderPublicProfileInput>(
    key: K,
    value: ProviderPublicProfileInput[K]
  ) => void;
  updatePublicLocale: (
    locale: ProviderPublicProfileI18n["locale"],
    patch: Partial<ProviderPublicProfileI18n>
  ) => void;
}) {
  const [activeLocale, setActiveLocale] =
    useState<ProviderPublicProfileI18n["locale"]>("ko");
  const activeLocaleOption =
    publicLocaleOptions.find(option => option.value === activeLocale) ??
    publicLocaleOptions[0];
  const activeLocaleRow =
    publicDraft.i18n.find(row => row.locale === activeLocaleOption.value) ??
    ({
      locale: activeLocaleOption.value,
      name: "",
      summary: "",
      description: "",
      address: "",
      specialties: [],
      highlights: [],
    } satisfies ProviderPublicProfileI18n);

  return (
    <div className="border-t border-ink-200 pt-4 md:col-span-2">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="font-serif text-2xl text-ink-950">공개 프로필 CMS</h3>
        <p className="text-sm leading-6 text-ink-600">
          공개 사이트 /hospitals에 노출될 병원 소개, 이미지, 의료진, 시술 정보를
          관리합니다. 상태가 published인 병원만 공개 API에 포함됩니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="공개 상태">
          <select
            value={publicDraft.status}
            onChange={event =>
              updatePublicDraft(
                "status",
                event.target.value as ProviderPublicStatus
              )
            }
            className={selectClassName}
          >
            {publicStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="공개 URL slug">
          <Input
            className={controlClassName}
            value={publicDraft.slug}
            onChange={event => updatePublicDraft("slug", event.target.value)}
            placeholder="gangnam-skin-clinic"
          />
        </Field>
        <Field label="공개 카테고리">
          <select
            value={publicDraft.specialty ?? "dermatology"}
            onChange={event =>
              updatePublicDraft("specialty", event.target.value)
            }
            className={selectClassName}
          >
            <option value="dermatology">피부과</option>
            <option value="plastic_surgery">성형외과</option>
            <option value="dental">치과</option>
            <option value="hair">모발이식</option>
            <option value="wellness">검진/웰니스</option>
          </select>
        </Field>
        <Field label="공개 지역">
          <select
            value={publicDraft.region ?? "gangnam"}
            onChange={event => updatePublicDraft("region", event.target.value)}
            className={selectClassName}
          >
            <option value="gangnam">Gangnam</option>
            <option value="seongsu">Seongsu</option>
            <option value="hongdae">Hongdae</option>
            <option value="sinchon">Sinchon</option>
            <option value="bundang">Bundang</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="공개 전화번호">
          <Input
            className={controlClassName}
            value={publicDraft.phonePublic ?? ""}
            onChange={event =>
              updatePublicDraft("phonePublic", event.target.value)
            }
            placeholder="+82-2-0000-0000"
          />
        </Field>
        <Field label="공식 웹사이트">
          <Input
            className={controlClassName}
            value={publicDraft.websiteUrl ?? ""}
            onChange={event =>
              updatePublicDraft("websiteUrl", event.target.value)
            }
            placeholder="https://example.com"
          />
        </Field>
        <Field label="가격대">
          <select
            value={publicDraft.priceTier ?? "$$"}
            onChange={event =>
              updatePublicDraft(
                "priceTier",
                event.target.value as ProviderPublicProfileInput["priceTier"]
              )
            }
            className={selectClassName}
          >
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </Field>
        <Field label="평점">
          <Input
            className={controlClassName}
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={publicDraft.rating ?? ""}
            onChange={event =>
              updatePublicDraft(
                "rating",
                event.target.value ? Number(event.target.value) : null
              )
            }
          />
        </Field>
        <Field label="리뷰 수">
          <Input
            className={controlClassName}
            type="number"
            min={0}
            value={publicDraft.reviewCount ?? 0}
            onChange={event =>
              updatePublicDraft("reviewCount", Number(event.target.value))
            }
          />
        </Field>
        <Check
          label="추천 병원으로 노출"
          checked={Boolean(publicDraft.featured)}
          onChange={checked => updatePublicDraft("featured", checked)}
        />
        <Field label="대표 이미지 URL" span="full">
          <Input
            className={controlClassName}
            value={coverUrl(publicDraft)}
            onChange={event =>
              updatePublicDraft(
                "media",
                updateCoverUrl(publicDraft, event.target.value)
              )
            }
            placeholder="https://..."
          />
        </Field>
        <Field label="상세 이미지 URL 목록" span="full">
          <Textarea
            className={textareaClassName}
            value={mediaRowsToText(publicDraft.media)}
            onChange={event =>
              updatePublicDraft(
                "media",
                mediaRowsFromText(event.target.value, publicDraft.media)
              )
            }
            placeholder="이미지 URL을 한 줄에 하나씩 입력"
          />
        </Field>
      </div>

      <div className="mt-4 border-t border-ink-200 pt-3">
        <div className="mb-3 flex flex-col gap-2">
          <div className="text-sm font-semibold text-ink-900">
            언어별 공개 설정
          </div>
          <div className="flex flex-wrap gap-1.5">
            {publicLocaleOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveLocale(option.value)}
                className={cn(
                  "h-8 rounded-md border px-3 text-xs font-semibold transition",
                  activeLocaleOption.value === option.value
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="공개 병원명">
            <Input
              className={controlClassName}
              value={activeLocaleRow.name}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  name: event.target.value,
                })
              }
            />
          </Field>
          <Field label="공개 주소">
            <Input
              className={controlClassName}
              value={activeLocaleRow.address ?? ""}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  address: event.target.value,
                })
              }
            />
          </Field>
          <Field label="한 줄 요약" span="full">
            <Input
              className={controlClassName}
              value={activeLocaleRow.summary ?? ""}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  summary: event.target.value,
                })
              }
            />
          </Field>
          <Field label="상세 소개" span="full">
            <Textarea
              className="min-h-28 w-full resize-y border-ink-200 bg-white text-sm text-ink-900 shadow-none"
              value={activeLocaleRow.description ?? ""}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  description: event.target.value,
                })
              }
            />
          </Field>
          <Field label="전문 분야" span="full">
            <Textarea
              className={textareaClassName}
              value={joinListText(activeLocaleRow.specialties)}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  specialties: splitListText(event.target.value),
                })
              }
              placeholder={"Laser toning\nSkin booster"}
            />
          </Field>
          <Field label="강점/체크포인트" span="full">
            <Textarea
              className={textareaClassName}
              value={joinListText(activeLocaleRow.highlights)}
              onChange={event =>
                updatePublicLocale(activeLocaleOption.value, {
                  highlights: splitListText(event.target.value),
                })
              }
              placeholder={"Same-day consult\nLow downtime plan"}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-ink-200 pt-3">
        <Field label="의료진 목록" span="full">
          <Textarea
            className="min-h-28 w-full resize-y border-ink-200 bg-white text-sm text-ink-900 shadow-none"
            value={doctorsToText(publicDraft.doctors)}
            onChange={event =>
              updatePublicDraft("doctors", doctorsFromText(event.target.value))
            }
            placeholder="Dr. Kim | Dermatologist | Laser | 12 | Bio text | https://photo-url"
          />
        </Field>
        <Field label="공개 시술/가격 목록" span="full">
          <Textarea
            className="min-h-28 w-full resize-y border-ink-200 bg-white text-sm text-ink-900 shadow-none"
            value={treatmentsToText(publicDraft.treatments)}
            onChange={event =>
              updatePublicDraft(
                "treatments",
                treatmentsFromText(event.target.value)
              )
            }
            placeholder="Laser toning | 200000 | 600000 | 0 | 40 | Per session | laser-toning"
          />
        </Field>
      </div>
    </div>
  );
}
