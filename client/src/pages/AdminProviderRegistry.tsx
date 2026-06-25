import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Database, Pencil, Plus, RefreshCw, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { betaProviders, type BetaProviderCandidate } from "@/lib/betaData";
import { languageListLabel } from "@/lib/adminLabels";
import {
  createProviderMvp,
  deleteProviderMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  updateProviderMvp,
  type AdminProviderInput,
  type ProviderOperatingProfile,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

type RegistryStatus = "loading" | "ready" | "saving" | "deleting" | "error";

const languageOptions = ["ko", "en", "ja", "zh", "ar"];
const marketOptions = ["japan", "taiwan", "global", "middle_east"];
const controlClassName = "h-9 w-full border-ink-200 bg-white text-sm text-ink-900 shadow-none";
const selectClassName =
  "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15";
const textareaClassName = "h-20 min-h-20 w-full resize-none border-ink-200 bg-white text-sm text-ink-900 shadow-none";

const facilityOptions: Array<{ value: AdminProviderInput["facilityType"]; label: string }> = [
  { value: "clinic", label: "의원" },
  { value: "hospital", label: "병원" },
  { value: "general_hospital", label: "종합병원" },
  { value: "tertiary_hospital", label: "상급종합병원" },
];

const exposureOptions: Array<{ value: AdminProviderInput["publicExposureStatus"]; label: string }> = [
  { value: "blocked", label: "차단" },
  { value: "candidate", label: "후보" },
  { value: "ready", label: "준비 완료" },
  { value: "published", label: "공개" },
];

const dataSourceOptions: Array<{ value: AdminProviderInput["dataSourceStatus"]; label: string }> = [
  { value: "candidate", label: "후보" },
  { value: "verified_docs", label: "서류 확인" },
  { value: "contracted", label: "계약 완료" },
  { value: "demo_seed", label: "데모" },
];

const slaStatusOptions: Array<{ value: AdminProviderInput["slaContractStatus"]; label: string }> = [
  { value: "draft", label: "초안" },
  { value: "sent", label: "발송" },
  { value: "negotiating", label: "협의" },
  { value: "pending_docs", label: "서류 대기" },
  { value: "signed", label: "서명 완료" },
];

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
    nextStep: "검증 서류 확인",
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizeFacilityType(value?: string): AdminProviderInput["facilityType"] {
  return facilityOptions.some((option) => option.value === value) ? (value as AdminProviderInput["facilityType"]) : "clinic";
}

function providerToDraft(provider: BetaProviderCandidate, profile?: ProviderOperatingProfile): AdminProviderInput {
  return {
    ...createDefaultProviderDraft(),
    nameLegal: provider.nameLegal || provider.name,
    nameDisplayKo: provider.nameDisplayKo || provider.name,
    nameDisplayEn: provider.nameDisplayEn || provider.name,
    opsEmail: provider.opsEmail || "",
    facilityType: normalizeFacilityType(provider.facilityType || provider.specialty),
    address: provider.address || "",
    city: provider.city || "Seoul",
    district: provider.district || provider.region || "",
    countryCode: provider.countryCode || "KR",
    medicalKoreaRegistered: provider.medicalKoreaRegistered ?? provider.registrationVerified,
    active: provider.active,
    defaultCommissionCapRate: provider.defaultCommissionCapRate ?? 0.3,
    qualityScore: provider.qualityScore ?? provider.betaScore,
    publicExposureStatus: profile?.publicExposureStatus ?? "candidate",
    dataSourceStatus: profile?.dataSourceStatus ?? "candidate",
    supportedMarkets: profile?.supportedMarkets?.length ? profile.supportedMarkets : ["japan", "taiwan"],
    supportedLanguages: profile?.supportedLanguages?.length ? profile.supportedLanguages : provider.languages,
    standardSlaHours: profile?.standardSlaHours ?? provider.slaHours,
    urgentSlaHours: profile?.urgentSlaHours ?? provider.urgentSlaHours,
    priceRangeUsdMin: profile?.priceRangeUsdMin ?? null,
    priceRangeUsdMax: profile?.priceRangeUsdMax ?? null,
    quoteTemplateReady: profile?.quoteTemplateReady ?? provider.quoteTemplateReady,
    depositPolicyReady: profile?.depositPolicyReady ?? provider.depositPolicyReady,
    slaContractStatus: profile?.slaContractStatus ?? provider.slaStatus,
    verificationSummary: profile?.verificationSummary ?? "",
    sourceNotes: profile?.sourceNotes ?? "",
    nextStep: profile?.nextStep ?? provider.nextStep,
  };
}

export default function AdminProviderRegistry() {
  const [draft, setDraft] = useState<AdminProviderInput>(() => createDefaultProviderDraft());
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providers, setProviders] = useState<BetaProviderCandidate[]>(betaProviders);
  const [profiles, setProfiles] = useState<ProviderOperatingProfile[]>([]);
  const [status, setStatus] = useState<RegistryStatus>("loading");
  const [message, setMessage] = useState("병원 목록을 불러오는 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());

  const profileByProviderId = useMemo(() => new Map(profiles.map((profile) => [profile.providerId, profile])), [profiles]);
  const activeCount = providers.filter((provider) => provider.active).length;
  const readyCount = profiles.filter((profile) => profile.publicExposureStatus === "ready" || profile.publicExposureStatus === "published").length;
  const isBusy = status === "saving" || status === "deleting";

  function resetForm() {
    setDraft(createDefaultProviderDraft());
    setEditingProviderId(null);
  }

  function applySnapshot(snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>) {
    setProviders(snapshot.providers);
    setProfiles(snapshot.providerOperatingProfiles ?? []);
  }

  async function refreshProviders() {
    if (!adminToken) {
      setStatus("error");
      setMessage("운영 이메일 인증 세션이 필요합니다.");
      return;
    }

    try {
      setStatus("loading");
      const snapshot = await fetchPartnerMvpSnapshot(adminToken, { force: true });
      applySnapshot(snapshot);
      setStatus("ready");
      setMessage(`병원 ${snapshot.providers.length}곳을 불러왔습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "병원 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refreshProviders();
  }, []);

  const updateDraft = <K extends keyof AdminProviderInput>(key: K, value: AdminProviderInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) return;
    if (!draft.nameLegal.trim() || !draft.nameDisplayKo.trim() || !draft.address.trim()) {
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
      setMessage(editingProviderId ? "병원 정보를 수정했습니다." : "신규 병원을 등록했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "병원 저장에 실패했습니다.");
    }
  }

  function startEdit(provider: BetaProviderCandidate) {
    setDraft(providerToDraft(provider, profileByProviderId.get(provider.id)));
    setEditingProviderId(provider.id);
    setStatus("ready");
    setMessage(`${provider.name} 정보를 수정 중입니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeProvider(provider: BetaProviderCandidate) {
    if (!adminToken) return;
    if (!window.confirm(`${provider.name} 병원을 삭제할까요? 목록과 접근 권한에서 비활성화됩니다.`)) return;

    try {
      setStatus("deleting");
      const snapshot = await deleteProviderMvp(adminToken, provider.id);
      applySnapshot(snapshot);
      if (editingProviderId === provider.id) resetForm();
      setStatus("ready");
      setMessage(`${provider.name} 병원을 삭제했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "병원 삭제에 실패했습니다.");
    }
  }

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
              <h1 className="font-serif text-4xl text-ink-950 md:text-5xl">병원 등록</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
                병원 기본 정보, 운영 이메일 인증, 노출 상태, SLA, 가격 범위를 관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-9 border-ink-300 text-ink-800" onClick={() => void refreshProviders()} disabled={status === "loading"}>
                <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
                새로고침
              </Button>
              <Link href="/admin/partners">
                <Button type="button" variant="outline" className="h-9 border-ink-300 text-ink-800">
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
        <div className="container-wide grid gap-6 xl:grid-cols-[minmax(420px,0.92fr)_minmax(0,1.08fr)]">
          <form onSubmit={submitProvider} className="h-fit rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {editingProviderId ? <Pencil className="size-5 text-teal-700" /> : <Plus className="size-5 text-teal-700" />}
                <h2 className="font-serif text-2xl text-ink-950">{editingProviderId ? "병원 정보 수정" : "신규 병원 입력"}</h2>
              </div>
              {editingProviderId ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 text-ink-600" onClick={resetForm}>
                  <RotateCcw className="size-4" />
                  취소
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="법인명" span="full">
                <Input className={controlClassName} value={draft.nameLegal} onChange={(event) => updateDraft("nameLegal", event.target.value)} placeholder="ABC Dermatology Clinic" />
              </Field>
              <Field label="표시명(한국어)">
                <Input className={controlClassName} value={draft.nameDisplayKo} onChange={(event) => updateDraft("nameDisplayKo", event.target.value)} placeholder="ABC 피부과" />
              </Field>
              <Field label="표시명(영어)">
                <Input className={controlClassName} value={draft.nameDisplayEn ?? ""} onChange={(event) => updateDraft("nameDisplayEn", event.target.value)} placeholder="ABC Dermatology" />
              </Field>
              <Field label="운영 인증 이메일" span="full">
                <Input className={controlClassName} type="email" value={draft.opsEmail ?? ""} onChange={(event) => updateDraft("opsEmail", event.target.value)} placeholder="hospital-ops@example.com" />
              </Field>
              <Field label="기관 유형">
                <select value={draft.facilityType} onChange={(event) => updateDraft("facilityType", event.target.value as AdminProviderInput["facilityType"])} className={selectClassName}>
                  {facilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="도시">
                <Input className={controlClassName} value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />
              </Field>
              <Field label="구/지역">
                <Input className={controlClassName} value={draft.district ?? ""} onChange={(event) => updateDraft("district", event.target.value)} />
              </Field>
              <Field label="국가 코드">
                <Input className={controlClassName} value={draft.countryCode} onChange={(event) => updateDraft("countryCode", event.target.value.toUpperCase().slice(0, 2))} />
              </Field>
              <Field label="주소" span="full">
                <Input className={controlClassName} value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Seoul, Gangnam-gu ..." />
              </Field>

              <OptionGroup label="지원 언어" values={languageOptions} selected={draft.supportedLanguages} onToggle={(value) => updateDraft("supportedLanguages", toggleValue(draft.supportedLanguages, value))} />
              <OptionGroup label="지원 시장" values={marketOptions} selected={draft.supportedMarkets} onToggle={(value) => updateDraft("supportedMarkets", toggleValue(draft.supportedMarkets, value))} />

              <Field label="표준 SLA(시간)">
                <Input className={controlClassName} type="number" min={1} value={draft.standardSlaHours} onChange={(event) => updateDraft("standardSlaHours", Number(event.target.value))} />
              </Field>
              <Field label="긴급 SLA(시간)">
                <Input className={controlClassName} type="number" min={1} value={draft.urgentSlaHours} onChange={(event) => updateDraft("urgentSlaHours", Number(event.target.value))} />
              </Field>
              <Field label="품질 점수">
                <Input className={controlClassName} type="number" min={0} max={100} value={draft.qualityScore} onChange={(event) => updateDraft("qualityScore", Number(event.target.value))} />
              </Field>
              <Field label="수수료 상한">
                <Input className={controlClassName} type="number" min={0} max={0.3} step={0.01} value={draft.defaultCommissionCapRate} onChange={(event) => updateDraft("defaultCommissionCapRate", Number(event.target.value))} />
              </Field>

              <Field label="노출 상태">
                <select value={draft.publicExposureStatus} onChange={(event) => updateDraft("publicExposureStatus", event.target.value as AdminProviderInput["publicExposureStatus"])} className={selectClassName}>
                  {exposureOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="자료 상태">
                <select value={draft.dataSourceStatus} onChange={(event) => updateDraft("dataSourceStatus", event.target.value as AdminProviderInput["dataSourceStatus"])} className={selectClassName}>
                  {dataSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="SLA 계약">
                <select value={draft.slaContractStatus} onChange={(event) => updateDraft("slaContractStatus", event.target.value as AdminProviderInput["slaContractStatus"])} className={selectClassName}>
                  {slaStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="가격 하한(USD)">
                <Input className={controlClassName} type="number" min={0} value={draft.priceRangeUsdMin ?? ""} onChange={(event) => updateDraft("priceRangeUsdMin", event.target.value ? Number(event.target.value) : null)} />
              </Field>
              <Field label="가격 상한(USD)">
                <Input className={controlClassName} type="number" min={0} value={draft.priceRangeUsdMax ?? ""} onChange={(event) => updateDraft("priceRangeUsdMax", event.target.value ? Number(event.target.value) : null)} />
              </Field>

              <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                <Check label="Medical Korea 등록 확인" checked={draft.medicalKoreaRegistered} onChange={(checked) => updateDraft("medicalKoreaRegistered", checked)} />
                <Check label="활성 병원" checked={draft.active} onChange={(checked) => updateDraft("active", checked)} />
                <Check label="견적 템플릿 준비" checked={draft.quoteTemplateReady} onChange={(checked) => updateDraft("quoteTemplateReady", checked)} />
                <Check label="예약금 정책 준비" checked={draft.depositPolicyReady} onChange={(checked) => updateDraft("depositPolicyReady", checked)} />
              </div>

              <Field label="다음 액션" span="full">
                <Input className={controlClassName} value={draft.nextStep ?? ""} onChange={(event) => updateDraft("nextStep", event.target.value)} />
              </Field>
              <Field label="검증 메모" span="full">
                <Textarea className={textareaClassName} value={draft.verificationSummary ?? ""} onChange={(event) => updateDraft("verificationSummary", event.target.value)} />
              </Field>

              <Button type="submit" disabled={isBusy} className="h-9 bg-teal-700 text-sm text-white hover:bg-teal-800 md:col-span-2">
                <Save className="size-4" />
                {status === "saving" ? "저장 중" : editingProviderId ? "수정 저장" : "병원 등록"}
              </Button>
            </div>
          </form>

          <div className="min-w-0">
            <div className={cn("mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm", status === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-teal-200 bg-teal-50 text-teal-900")}>
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
                  {providers.map((provider) => {
                    const profile = profileByProviderId.get(provider.id);
                    const isEditing = editingProviderId === provider.id;
                    return (
                      <tr key={provider.id} className={cn(isEditing && "bg-teal-50/60")}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-950">{provider.name}</div>
                          <div className="mt-1 text-xs text-ink-500">{provider.region} / {provider.specialty}</div>
                          {provider.opsEmail ? <div className="mt-1 text-xs text-ink-500">{provider.opsEmail}</div> : null}
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {languageListLabel(provider.languages)}
                          <div className="mt-1 text-xs text-ink-500">표준 {provider.slaHours}h / 긴급 {provider.urgentSlaHours}h</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700">{profile?.publicExposureStatus ?? "candidate"}</span>
                          <div className="mt-1 text-xs text-ink-500">{provider.active ? "활성" : "비활성"} / {provider.nextStep}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink-950">{provider.betaScore}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" className="h-8 border-ink-200 px-2 text-xs" onClick={() => startEdit(provider)} disabled={isBusy}>
                              <Pencil className="size-3.5" />
                              수정
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-8 border-rose-200 px-2 text-xs text-rose-700 hover:bg-rose-50" onClick={() => void removeProvider(provider)} disabled={isBusy}>
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

function Field({ label, children, span }: { label: string; children: ReactNode; span?: "full" }) {
  return (
    <label className={cn("grid min-w-0 gap-1.5", span === "full" && "md:col-span-2")}>
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function OptionGroup({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs font-semibold text-ink-700">{label}</div>
      <div className="flex min-h-9 flex-wrap gap-1.5">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "h-8 rounded-md border px-2.5 text-xs font-semibold",
              selected.includes(value) ? "border-teal-700 bg-teal-700 text-white" : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-ink-300 accent-teal-700" />
      <span className="font-semibold">{label}</span>
    </label>
  );
}
