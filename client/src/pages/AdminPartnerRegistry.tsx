import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Database, RefreshCw, Save, ShieldCheck, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { betaPartners, betaProviders } from "@/lib/betaData";
import { languageListLabel } from "@/lib/adminLabels";
import {
  createPartnerMvp,
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  type AdminPartnerInput,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

const partnerTypeOptions: Array<{ value: AdminPartnerInput["partnerType"]; label: string }> = [
  { value: "agency", label: "의료 에이전시" },
  { value: "personal_agent", label: "개인 에이전트" },
  { value: "interpreter", label: "통역" },
  { value: "travel_agency", label: "여행사" },
  { value: "concierge", label: "컨시어지" },
];

const serviceOptions = ["medical_agency", "personal_agent", "interpreter", "travel_agency", "airport_pickup", "hotel_recovery", "concierge"];

const defaultPartnerDraft: AdminPartnerInput = {
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

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function AdminPartnerRegistry() {
  const [draft, setDraft] = useState<AdminPartnerInput>(defaultPartnerDraft);
  const [partners, setPartners] = useState(betaPartners);
  const [providers, setProviders] = useState(betaProviders);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [message, setMessage] = useState("에이전트 목록을 불러오는 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());

  const providerById = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);
  const activeCount = partners.filter((partner) => partner.active).length;
  const verifiedCount = partners.filter((partner) => partner.verificationStatus === "verified").length;

  async function refreshPartners() {
    if (!adminToken) {
      setStatus("error");
      setMessage("운영 이메일 인증 세션이 필요합니다.");
      return;
    }

    try {
      setStatus("loading");
      const snapshot = await fetchPartnerMvpSnapshot(adminToken, { force: true });
      if (snapshot.partners.length) setPartners(snapshot.partners);
      if (snapshot.providers.length) setProviders(snapshot.providers);
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
      const snapshot = await createPartnerMvp(adminToken, {
        ...draft,
        opsEmail: draft.opsEmail || draft.contactEmail,
      });
      setPartners(snapshot.partners);
      setProviders(snapshot.providers);
      setDraft(defaultPartnerDraft);
      setStatus("ready");
      setMessage("신규 에이전트가 등록됐고, 운영 이메일이 있으면 파트너 접근 권한도 함께 생성됐습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "신규 에이전트 등록에 실패했습니다.");
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
              <h1 className="font-serif text-5xl text-ink-950">에이전트 등록</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-600">
                신규 에이전트 기본 정보, 연락처, 운영 이메일 권한, 지원 서비스와 선호 병원을 등록합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="border-ink-300 text-ink-800" onClick={() => void refreshPartners()} disabled={status === "loading"}>
                <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
                새로고침
              </Button>
              <Link href="/admin/providers">
                <Button type="button" variant="outline" className="border-ink-300 text-ink-800">
                  병원 등록
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric label="등록 에이전트" value={partners.length} />
            <Metric label="활성 에이전트" value={activeCount} />
            <Metric label="검증 완료" value={verifiedCount} />
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={submitPartner} className="rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-5 flex items-center gap-2">
              <UserPlus className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">신규 에이전트 입력</h2>
            </div>

            <div className="grid gap-4">
              <Field label="에이전트명">
                <Input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Tokyo Care Bridge" />
              </Field>
              <Field label="유형">
                <select value={draft.partnerType} onChange={(event) => updateDraft("partnerType", event.target.value as AdminPartnerInput["partnerType"])} className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm">
                  {partnerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="연락 이메일">
                  <Input type="email" value={draft.contactEmail ?? ""} onChange={(event) => updateDraft("contactEmail", event.target.value)} placeholder="agency@example.com" />
                </Field>
                <Field label="운영 인증 이메일">
                  <Input type="email" value={draft.opsEmail ?? ""} onChange={(event) => updateDraft("opsEmail", event.target.value)} placeholder="비워두면 연락 이메일 사용" />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="연락처">
                  <Input value={draft.contactPhone ?? ""} onChange={(event) => updateDraft("contactPhone", event.target.value)} placeholder="+81 ..." />
                </Field>
                <Field label="기본 수익배분율">
                  <Input type="number" min={0} max={1} step={0.01} value={draft.defaultRevenueShareRate} onChange={(event) => updateDraft("defaultRevenueShareRate", Number(event.target.value))} />
                </Field>
              </div>

              <OptionGroup label="지원 서비스" values={serviceOptions} selected={draft.services} onToggle={(value) => updateDraft("services", toggleValue(draft.services, value))} />

              <div>
                <div className="mb-2 text-sm font-semibold text-ink-800">선호 병원</div>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-ink-200 bg-white p-2">
                  {providers.map((provider) => (
                    <label key={provider.id} className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-ink-50">
                      <input
                        type="checkbox"
                        checked={draft.preferredProviderIds.includes(provider.id)}
                        onChange={() => updateDraft("preferredProviderIds", toggleValue(draft.preferredProviderIds, provider.id))}
                        className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                      />
                      <span>
                        <span className="font-semibold text-ink-950">{provider.name}</span>
                        <span className="block text-xs text-ink-500">
                          {provider.region} / {languageListLabel(provider.languages)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-md border border-ink-200 bg-white p-3 text-sm text-ink-700">
                <input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} className="size-4 rounded border-ink-300 accent-teal-700" />
                <span className="font-semibold">활성 에이전트</span>
              </label>

              <Field label="메모">
                <textarea value={draft.notes ?? ""} onChange={(event) => updateDraft("notes", event.target.value)} rows={3} className="w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm" />
              </Field>

              <Button type="submit" disabled={status === "saving"} className="h-11 bg-teal-700 text-white hover:bg-teal-800">
                <Save className="size-4" />
                {status === "saving" ? "저장 중" : "에이전트 등록"}
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
                    <th className="px-4 py-3">에이전트</th>
                    <th className="px-4 py-3">서비스</th>
                    <th className="px-4 py-3">선호 병원</th>
                    <th className="px-4 py-3">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {partners.map((partner) => (
                    <tr key={partner.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">{partner.name}</div>
                        <div className="mt-1 text-xs text-ink-500">{partner.type}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {partner.services.length ? partner.services.join(", ") : "-"}
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
                    </tr>
                  ))}
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
