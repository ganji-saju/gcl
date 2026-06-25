import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Database, Plus, RefreshCw, Save, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { betaProviders } from "@/lib/betaData";
import { languageListLabel } from "@/lib/adminLabels";
import {
  createProviderMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  type AdminProviderInput,
  type ProviderOperatingProfile,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

const languageOptions = ["ko", "en", "ja", "zh", "ar"];
const marketOptions = ["japan", "taiwan", "global", "middle_east"];

const defaultProviderDraft: AdminProviderInput = {
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

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function AdminProviderRegistry() {
  const [draft, setDraft] = useState<AdminProviderInput>(defaultProviderDraft);
  const [providers, setProviders] = useState(betaProviders);
  const [profiles, setProfiles] = useState<ProviderOperatingProfile[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("병원 목록을 불러오는 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());

  const profileByProviderId = useMemo(() => new Map(profiles.map((profile) => [profile.providerId, profile])), [profiles]);
  const activeCount = providers.filter((provider) => provider.active).length;
  const readyCount = profiles.filter((profile) => profile.publicExposureStatus === "ready" || profile.publicExposureStatus === "published").length;

  async function refreshProviders() {
    if (!adminToken) {
      setStatus("error");
      setMessage("운영 이메일 인증 세션이 필요합니다.");
      return;
    }

    try {
      setStatus("loading");
      const snapshot = await fetchPartnerMvpSnapshot(adminToken, { force: true });
      if (snapshot.providers.length) setProviders(snapshot.providers);
      setProfiles(snapshot.providerOperatingProfiles ?? []);
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
      const snapshot = await createProviderMvp(adminToken, draft);
      setProviders(snapshot.providers);
      setProfiles(snapshot.providerOperatingProfiles ?? []);
      setDraft(defaultProviderDraft);
      setStatus("ready");
      setMessage("신규 병원이 등록됐고, 운영 이메일이 있으면 병원 접근 권한도 함께 생성됐습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "신규 병원 등록에 실패했습니다.");
    }
  }

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ShieldCheck className="size-4" />
                관리자 전용
              </div>
              <h1 className="font-serif text-5xl text-ink-950">병원 등록</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-600">
                신규 병원 기본 정보, 외국인환자 응대 상태, 견적 SLA, 가격 범위, 병원 운영 이메일 권한을 한 번에 등록합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="border-ink-300 text-ink-800" onClick={() => void refreshProviders()} disabled={status === "loading"}>
                <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
                새로고침
              </Button>
              <Link href="/admin/partners">
                <Button type="button" variant="outline" className="border-ink-300 text-ink-800">
                  에이전트 등록
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric label="등록 병원" value={providers.length} />
            <Metric label="활성 병원" value={activeCount} />
            <Metric label="노출 준비" value={readyCount} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={submitProvider} className="rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">신규 병원 입력</h2>
            </div>

            <div className="grid gap-4">
              <Field label="법인명">
                <Input value={draft.nameLegal} onChange={(event) => updateDraft("nameLegal", event.target.value)} placeholder="ABC Dermatology Clinic" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="표시명(한국어)">
                  <Input value={draft.nameDisplayKo} onChange={(event) => updateDraft("nameDisplayKo", event.target.value)} placeholder="ABC 피부과" />
                </Field>
                <Field label="표시명(영어)">
                  <Input value={draft.nameDisplayEn ?? ""} onChange={(event) => updateDraft("nameDisplayEn", event.target.value)} placeholder="ABC Dermatology" />
                </Field>
              </div>
              <Field label="병원 운영 이메일">
                <Input type="email" value={draft.opsEmail ?? ""} onChange={(event) => updateDraft("opsEmail", event.target.value)} placeholder="hospital-ops@example.com" />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="기관 유형">
                  <select value={draft.facilityType} onChange={(event) => updateDraft("facilityType", event.target.value as AdminProviderInput["facilityType"])} className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm">
                    <option value="clinic">의원</option>
                    <option value="hospital">병원</option>
                    <option value="general_hospital">종합병원</option>
                    <option value="tertiary_hospital">상급종합병원</option>
                  </select>
                </Field>
                <Field label="도시">
                  <Input value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />
                </Field>
                <Field label="구/지역">
                  <Input value={draft.district ?? ""} onChange={(event) => updateDraft("district", event.target.value)} />
                </Field>
              </div>
              <Field label="주소">
                <Input value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Seoul, Gangnam-gu ..." />
              </Field>

              <OptionGroup label="지원 언어" values={languageOptions} selected={draft.supportedLanguages} onToggle={(value) => updateDraft("supportedLanguages", toggleValue(draft.supportedLanguages, value))} />
              <OptionGroup label="지원 시장" values={marketOptions} selected={draft.supportedMarkets} onToggle={(value) => updateDraft("supportedMarkets", toggleValue(draft.supportedMarkets, value))} />

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="표준 SLA(시간)">
                  <Input type="number" min={1} value={draft.standardSlaHours} onChange={(event) => updateDraft("standardSlaHours", Number(event.target.value))} />
                </Field>
                <Field label="긴급 SLA(시간)">
                  <Input type="number" min={1} value={draft.urgentSlaHours} onChange={(event) => updateDraft("urgentSlaHours", Number(event.target.value))} />
                </Field>
                <Field label="품질 점수">
                  <Input type="number" min={0} max={100} value={draft.qualityScore} onChange={(event) => updateDraft("qualityScore", Number(event.target.value))} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="노출 상태">
                  <select value={draft.publicExposureStatus} onChange={(event) => updateDraft("publicExposureStatus", event.target.value as AdminProviderInput["publicExposureStatus"])} className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm">
                    <option value="blocked">차단</option>
                    <option value="candidate">후보</option>
                    <option value="ready">준비 완료</option>
                    <option value="published">공개</option>
                  </select>
                </Field>
                <Field label="자료 상태">
                  <select value={draft.dataSourceStatus} onChange={(event) => updateDraft("dataSourceStatus", event.target.value as AdminProviderInput["dataSourceStatus"])} className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm">
                    <option value="candidate">후보</option>
                    <option value="verified_docs">서류 확인</option>
                    <option value="contracted">계약 완료</option>
                    <option value="demo_seed">데모</option>
                  </select>
                </Field>
                <Field label="SLA 계약">
                  <select value={draft.slaContractStatus} onChange={(event) => updateDraft("slaContractStatus", event.target.value as AdminProviderInput["slaContractStatus"])} className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm">
                    <option value="draft">초안</option>
                    <option value="sent">발송</option>
                    <option value="negotiating">협의</option>
                    <option value="pending_docs">서류 대기</option>
                    <option value="signed">서명 완료</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="가격 하한(USD)">
                  <Input type="number" min={0} value={draft.priceRangeUsdMin ?? ""} onChange={(event) => updateDraft("priceRangeUsdMin", event.target.value ? Number(event.target.value) : null)} />
                </Field>
                <Field label="가격 상한(USD)">
                  <Input type="number" min={0} value={draft.priceRangeUsdMax ?? ""} onChange={(event) => updateDraft("priceRangeUsdMax", event.target.value ? Number(event.target.value) : null)} />
                </Field>
              </div>

              <div className="grid gap-2 text-sm text-ink-700 md:grid-cols-2">
                <Check label="외국인환자 등록 확인" checked={draft.medicalKoreaRegistered} onChange={(checked) => updateDraft("medicalKoreaRegistered", checked)} />
                <Check label="활성 병원" checked={draft.active} onChange={(checked) => updateDraft("active", checked)} />
                <Check label="견적 템플릿 준비" checked={draft.quoteTemplateReady} onChange={(checked) => updateDraft("quoteTemplateReady", checked)} />
                <Check label="예약금 정책 준비" checked={draft.depositPolicyReady} onChange={(checked) => updateDraft("depositPolicyReady", checked)} />
              </div>

              <Field label="다음 액션">
                <Input value={draft.nextStep ?? ""} onChange={(event) => updateDraft("nextStep", event.target.value)} />
              </Field>
              <Field label="검증 메모">
                <textarea value={draft.verificationSummary ?? ""} onChange={(event) => updateDraft("verificationSummary", event.target.value)} rows={3} className="w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm" />
              </Field>

              <Button type="submit" disabled={status === "saving"} className="h-11 bg-teal-700 text-white hover:bg-teal-800">
                <Save className="size-4" />
                {status === "saving" ? "저장 중" : "병원 등록"}
              </Button>
            </div>
          </form>

          <div>
            <div className={cn("mb-5 flex items-start gap-3 rounded-lg border p-4 text-sm", status === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-teal-200 bg-teal-50 text-teal-900")}>
              <Database className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold">저장 상태</div>
                <div className="mt-1">{message}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">병원</th>
                    <th className="px-4 py-3">언어/SLA</th>
                    <th className="px-4 py-3">운영 상태</th>
                    <th className="px-4 py-3">품질</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {providers.map((provider) => {
                    const profile = profileByProviderId.get(provider.id);
                    return (
                      <tr key={provider.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-950">{provider.name}</div>
                          <div className="mt-1 text-xs text-ink-500">{provider.region} / {provider.specialty}</div>
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
      <div className="mt-2 font-serif text-3xl text-ink-950">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink-800">{label}</span>
      {children}
    </label>
  );
}

function OptionGroup({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-ink-800">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold", selected.includes(value) ? "border-teal-700 bg-teal-700 text-white" : "border-ink-200 bg-white text-ink-600")}
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
    <label className="flex items-center gap-2 rounded-md border border-ink-200 bg-white p-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-ink-300 accent-teal-700" />
      <span className="font-semibold">{label}</span>
    </label>
  );
}
