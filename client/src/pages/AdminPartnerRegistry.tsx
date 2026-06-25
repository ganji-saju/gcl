import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Database, Pencil, RefreshCw, RotateCcw, Save, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { betaPartners, betaProviders, type BetaPartner, type BetaProviderCandidate } from "@/lib/betaData";
import { languageListLabel } from "@/lib/adminLabels";
import {
  createPartnerMvp,
  deletePartnerMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  updatePartnerMvp,
  type AdminPartnerInput,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

type RegistryStatus = "loading" | "ready" | "saving" | "deleting" | "error";

const controlClassName = "h-9 w-full border-ink-200 bg-white text-sm text-ink-900 shadow-none";
const selectClassName =
  "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15";
const textareaClassName = "h-20 min-h-20 w-full resize-none border-ink-200 bg-white text-sm text-ink-900 shadow-none";

const partnerTypeOptions: Array<{ value: AdminPartnerInput["partnerType"]; label: string }> = [
  { value: "agency", label: "의료 에이전시" },
  { value: "personal_agent", label: "개인 에이전트" },
  { value: "interpreter", label: "통역" },
  { value: "travel_agency", label: "여행사" },
  { value: "concierge", label: "컨시어지" },
];

const serviceOptions = [
  "medical_agency",
  "personal_agent",
  "interpreter",
  "travel_agency",
  "airport_pickup",
  "hotel_recovery",
  "concierge",
];

const serviceLabels: Record<string, string> = {
  medical_agency: "의료 에이전시",
  personal_agent: "개인 에이전트",
  interpreter: "통역",
  travel_agency: "여행",
  airport_pickup: "공항 픽업",
  hotel_recovery: "회복 숙소",
  concierge: "컨시어지",
};

function createDefaultPartnerDraft(): AdminPartnerInput {
  return {
    name: "",
    partnerType: "agency",
    contactEmail: "",
    contactPhone: "",
    opsEmail: "",
    defaultRevenueShareRate: 0,
    active: true,
    services: ["medical_agency"],
    preferredProviderIds: [],
    notes: "",
  };
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizePartnerType(value?: string): AdminPartnerInput["partnerType"] {
  return partnerTypeOptions.some((option) => option.value === value) ? (value as AdminPartnerInput["partnerType"]) : "agency";
}

function partnerToDraft(partner: BetaPartner): AdminPartnerInput {
  return {
    ...createDefaultPartnerDraft(),
    name: partner.name,
    partnerType: normalizePartnerType(partner.type),
    contactEmail: partner.contactEmail || "",
    contactPhone: partner.contactPhone || "",
    opsEmail: partner.opsEmail || partner.contactEmail || "",
    defaultRevenueShareRate: partner.defaultRevenueShareRate ?? 0,
    active: partner.active,
    services: partner.services.length ? partner.services : ["medical_agency"],
    preferredProviderIds: partner.preferredProviderIds,
    notes: "",
  };
}

export default function AdminPartnerRegistry() {
  const [draft, setDraft] = useState<AdminPartnerInput>(() => createDefaultPartnerDraft());
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partners, setPartners] = useState<BetaPartner[]>(betaPartners);
  const [providers, setProviders] = useState<BetaProviderCandidate[]>(betaProviders);
  const [status, setStatus] = useState<RegistryStatus>("loading");
  const [message, setMessage] = useState("에이전트 목록을 불러오는 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());

  const providerById = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);
  const activeCount = partners.filter((partner) => partner.active).length;
  const verifiedCount = partners.filter((partner) => partner.verificationStatus === "verified").length;
  const isBusy = status === "saving" || status === "deleting";

  function resetForm() {
    setDraft(createDefaultPartnerDraft());
    setEditingPartnerId(null);
  }

  function applySnapshot(snapshot: Awaited<ReturnType<typeof fetchPartnerMvpSnapshot>>) {
    setPartners(snapshot.partners);
    setProviders(snapshot.providers);
  }

  async function refreshPartners() {
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
      setMessage(`에이전트 ${snapshot.partners.length}곳을 불러왔습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "에이전트 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refreshPartners();
  }, []);

  const updateDraft = <K extends keyof AdminPartnerInput>(key: K, value: AdminPartnerInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function submitPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminToken) return;
    if (!draft.name.trim()) {
      setStatus("error");
      setMessage("에이전트명은 필수입니다.");
      return;
    }

    try {
      setStatus("saving");
      const payload = { ...draft, opsEmail: draft.opsEmail || draft.contactEmail };
      const snapshot = editingPartnerId
        ? await updatePartnerMvp(adminToken, editingPartnerId, payload)
        : await createPartnerMvp(adminToken, payload);
      applySnapshot(snapshot);
      resetForm();
      setStatus("ready");
      setMessage(editingPartnerId ? "에이전트 정보를 수정했습니다." : "신규 에이전트를 등록했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "에이전트 저장에 실패했습니다.");
    }
  }

  function startEdit(partner: BetaPartner) {
    setDraft(partnerToDraft(partner));
    setEditingPartnerId(partner.id);
    setStatus("ready");
    setMessage(`${partner.name} 정보를 수정 중입니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removePartner(partner: BetaPartner) {
    if (!adminToken) return;
    if (!window.confirm(`${partner.name} 에이전트를 삭제할까요? 목록과 접근 권한에서 비활성화됩니다.`)) return;

    try {
      setStatus("deleting");
      const snapshot = await deletePartnerMvp(adminToken, partner.id);
      applySnapshot(snapshot);
      if (editingPartnerId === partner.id) resetForm();
      setStatus("ready");
      setMessage(`${partner.name} 에이전트를 삭제했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "에이전트 삭제에 실패했습니다.");
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
              <h1 className="font-serif text-4xl text-ink-950 md:text-5xl">에이전트 등록</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
                에이전시 기본 정보, 운영 이메일 인증, 지원 서비스, 선호 병원 연결을 관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-9 border-ink-300 text-ink-800" onClick={() => void refreshPartners()} disabled={status === "loading"}>
                <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
                새로고침
              </Button>
              <Link href="/admin/providers">
                <Button type="button" variant="outline" className="h-9 border-ink-300 text-ink-800">
                  병원 등록
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Metric label="등록 에이전트" value={partners.length} />
            <Metric label="활성 에이전트" value={activeCount} />
            <Metric label="검증 완료" value={verifiedCount} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-6 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={submitPartner} className="h-fit rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {editingPartnerId ? <Pencil className="size-5 text-teal-700" /> : <UserPlus className="size-5 text-teal-700" />}
                <h2 className="font-serif text-2xl text-ink-950">{editingPartnerId ? "에이전트 정보 수정" : "신규 에이전트 입력"}</h2>
              </div>
              {editingPartnerId ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 text-ink-600" onClick={resetForm}>
                  <RotateCcw className="size-4" />
                  취소
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="에이전트명" span="full">
                <Input className={controlClassName} value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Tokyo Care Bridge" />
              </Field>
              <Field label="유형">
                <select value={draft.partnerType} onChange={(event) => updateDraft("partnerType", event.target.value as AdminPartnerInput["partnerType"])} className={selectClassName}>
                  {partnerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="수익 배분율">
                <Input className={controlClassName} type="number" min={0} max={1} step={0.01} value={draft.defaultRevenueShareRate} onChange={(event) => updateDraft("defaultRevenueShareRate", Number(event.target.value))} />
              </Field>
              <Field label="연락 이메일">
                <Input className={controlClassName} type="email" value={draft.contactEmail ?? ""} onChange={(event) => updateDraft("contactEmail", event.target.value)} placeholder="agency@example.com" />
              </Field>
              <Field label="운영 인증 이메일">
                <Input className={controlClassName} type="email" value={draft.opsEmail ?? ""} onChange={(event) => updateDraft("opsEmail", event.target.value)} placeholder="비워두면 연락 이메일 사용" />
              </Field>
              <Field label="연락처">
                <Input className={controlClassName} value={draft.contactPhone ?? ""} onChange={(event) => updateDraft("contactPhone", event.target.value)} placeholder="+81 ..." />
              </Field>

              <OptionGroup label="지원 서비스" values={serviceOptions} selected={draft.services} onToggle={(value) => updateDraft("services", toggleValue(draft.services, value))} />

              <div className="md:col-span-2">
                <div className="mb-1.5 text-xs font-semibold text-ink-700">선호 병원</div>
                <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-md border border-ink-200 bg-white p-2">
                  {providers.map((provider) => (
                    <label key={provider.id} className="flex min-h-10 items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ink-50">
                      <input
                        type="checkbox"
                        checked={draft.preferredProviderIds.includes(provider.id)}
                        onChange={() => updateDraft("preferredProviderIds", toggleValue(draft.preferredProviderIds, provider.id))}
                        className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink-950">{provider.name}</span>
                        <span className="block text-xs text-ink-500">
                          {provider.region} / {languageListLabel(provider.languages)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Check label="활성 에이전트" checked={draft.active} onChange={(checked) => updateDraft("active", checked)} />

              <Field label="메모" span="full">
                <Textarea className={textareaClassName} value={draft.notes ?? ""} onChange={(event) => updateDraft("notes", event.target.value)} />
              </Field>

              <Button type="submit" disabled={isBusy} className="h-9 bg-teal-700 text-sm text-white hover:bg-teal-800 md:col-span-2">
                <Save className="size-4" />
                {status === "saving" ? "저장 중" : editingPartnerId ? "수정 저장" : "에이전트 등록"}
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
                    <th className="px-4 py-3 font-semibold">에이전트</th>
                    <th className="px-4 py-3 font-semibold">서비스</th>
                    <th className="px-4 py-3 font-semibold">선호 병원</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 text-right font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {partners.map((partner) => {
                    const isEditing = editingPartnerId === partner.id;
                    return (
                      <tr key={partner.id} className={cn(isEditing && "bg-teal-50/60")}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-950">{partner.name}</div>
                          <div className="mt-1 text-xs text-ink-500">{partner.type}</div>
                          {partner.opsEmail || partner.contactEmail ? <div className="mt-1 text-xs text-ink-500">{partner.opsEmail || partner.contactEmail}</div> : null}
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {partner.services.length ? partner.services.map((service) => serviceLabels[service] ?? service).join(", ") : "-"}
                          <div className="mt-1 text-xs text-ink-500">SLA {partner.slaHours}h</div>
                        </td>
                        <td className="px-4 py-3 text-ink-600">
                          {partner.preferredProviderIds.length
                            ? partner.preferredProviderIds.map((providerId) => providerById.get(providerId)?.name ?? providerId.slice(0, 8)).join(", ")
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700">{partner.verificationStatus}</span>
                          <div className="mt-1 text-xs text-ink-500">{partner.active ? "활성" : "비활성"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" className="h-8 border-ink-200 px-2 text-xs" onClick={() => startEdit(partner)} disabled={isBusy}>
                              <Pencil className="size-3.5" />
                              수정
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-8 border-rose-200 px-2 text-xs text-rose-700 hover:bg-rose-50" onClick={() => void removePartner(partner)} disabled={isBusy}>
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
    <div className="min-w-0 md:col-span-2">
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
            {serviceLabels[value] ?? value}
          </button>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-700 md:col-span-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-ink-300 accent-teal-700" />
      <span className="font-semibold">{label}</span>
    </label>
  );
}
