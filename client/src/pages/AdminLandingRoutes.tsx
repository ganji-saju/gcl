import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, FilePlus2, ListChecks, Save, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKIN_LANDING_PAGES, SKIN_PACKAGE_SKUS, type LandingLocale, type SkinLandingPage, type WedgeMarket } from "@/lib/wedgeData";
import { languageLabel, marketLabel, statusLabel } from "@/lib/adminLabels";
import { cn } from "@/lib/utils";

type RouteStatus = "published" | "draft";

type ManagedLandingRoute = SkinLandingPage & {
  status: RouteStatus;
};

const defaultDraft: SkinLandingPage = {
  locale: "en",
  slug: "",
  market: "japan",
  intent: "",
  title: "",
  subtitle: "",
  searchTheme: "",
  cta: "",
  secondaryCta: "",
  packageIds: [],
};

function StatusBadge({ status }: { status: RouteStatus }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        status === "published" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-ink-200 bg-ink-50 text-ink-700",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function AdminLandingRoutes() {
  const [draft, setDraft] = useState<SkinLandingPage>(defaultDraft);
  const [localDrafts, setLocalDrafts] = useState<ManagedLandingRoute[]>([]);

  const routes = useMemo<ManagedLandingRoute[]>(() => {
    return [...SKIN_LANDING_PAGES.map((page) => ({ ...page, status: "published" as const })), ...localDrafts];
  }, [localDrafts]);

  const enCount = routes.filter((route) => route.locale === "en").length;
  const jpCount = routes.filter((route) => route.locale === "jp").length;
  const japanCount = routes.filter((route) => route.market === "japan").length;
  const taiwanCount = routes.filter((route) => route.market === "taiwan").length;

  const updateDraft = <K extends keyof SkinLandingPage>(key: K, value: SkinLandingPage[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const togglePackage = (packageId: string) => {
    setDraft((current) => ({
      ...current,
      packageIds: current.packageIds.includes(packageId)
        ? current.packageIds.filter((id) => id !== packageId)
        : [...current.packageIds, packageId],
    }));
  };

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.slug.trim() || !draft.title.trim() || !draft.intent.trim()) return;

    setLocalDrafts((current) => [
      ...current,
      {
        ...draft,
        slug: draft.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        status: "draft",
      },
    ]);
    setDraft(defaultDraft);
  };

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-ink-50">
        <div className="container-wide py-10">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <ShieldCheck className="size-4" />
                내부 관리자
              </div>
              <h1 className="font-serif text-5xl text-ink-950">랜딩 경로 관리</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-600">
                공개 홈과 별도로 영어/일본어 피부 패키지 랜딩 경로를 관리합니다. 게시된 행은 현재 정적 경로이고, 초안 행은 저장 기능 연결 전까지 로컬 관리자 입력으로 유지됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/beta">
                <Button variant="outline" className="border-ink-300 text-ink-800">
                  베타 운영
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/admin/cases">
                <Button className="bg-teal-700 text-white hover:bg-teal-800">
                  케이스 보드
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["전체 경로", routes.length],
              ["영어 / 일본어", `${enCount} / ${jpCount}`],
              ["일본 / 대만", `${japanCount} / ${taiwanCount}`],
              ["로컬 초안", localDrafts.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="text-sm font-semibold text-ink-500">{label}</div>
                <div className="mt-2 font-serif text-3xl text-ink-950">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="mb-5 flex items-center gap-2">
              <ListChecks className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">경로 목록</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">경로</th>
                    <th className="px-4 py-3">시장</th>
                    <th className="px-4 py-3">검색 의도</th>
                    <th className="px-4 py-3">패키지</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">열기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {routes.map((route) => (
                    <tr key={`${route.status}-${route.locale}-${route.slug}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-950">
                          {languageLabel(route.locale)} / {route.slug || "초안 경로"}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-ink-500">{route.title || "제목 없는 경로"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                          {marketLabel(route.market)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{route.intent || "검색 의도 미입력"}</td>
                      <td className="px-4 py-3 text-ink-600">{route.packageIds.join(", ") || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={route.status} />
                      </td>
                      <td className="px-4 py-3">
                        {route.slug ? (
                          <Link href={`/${route.locale}/${route.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                            보기
                            <ExternalLink className="size-3.5" />
                          </Link>
                        ) : (
                          <span className="text-ink-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-ink-200 bg-ink-50 p-5">
            <div className="mb-5 flex items-center gap-2">
              <FilePlus2 className="size-5 text-teal-700" />
              <h2 className="font-serif text-3xl text-ink-950">경로 초안 추가</h2>
            </div>
            <form onSubmit={submitDraft} className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-ink-800">언어</label>
                <select
                  value={draft.locale}
                  onChange={(event) => updateDraft("locale", event.target.value as LandingLocale)}
                  className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                >
                  <option value="en">영어</option>
                  <option value="jp">일본어</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-ink-800">시장</label>
                <select
                  value={draft.market}
                  onChange={(event) => updateDraft("market", event.target.value as WedgeMarket)}
                  className="h-11 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                >
                  <option value="japan">일본</option>
                  <option value="taiwan">대만</option>
                </select>
              </div>

              <Field label="슬러그">
                <Input value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} placeholder="korea-skin-package" />
              </Field>
              <Field label="검색 의도">
                <Input value={draft.intent} onChange={(event) => updateDraft("intent", event.target.value)} placeholder="한국 피부 패키지" />
              </Field>
              <Field label="제목">
                <Input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="랜딩 페이지 제목" />
              </Field>
              <Field label="부제목">
                <textarea
                  value={draft.subtitle}
                  onChange={(event) => updateDraft("subtitle", event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  placeholder="환자에게 보여줄 짧은 가치 제안"
                />
              </Field>
              <Field label="주요 버튼 문구">
                <Input value={draft.cta} onChange={(event) => updateDraft("cta", event.target.value)} placeholder="견적 요청" />
              </Field>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800">패키지 코드</label>
                <div className="grid gap-2">
                  {SKIN_PACKAGE_SKUS.map((pkg) => (
                    <label key={pkg.id} className="flex gap-2 rounded-md border border-ink-200 bg-white p-3 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={draft.packageIds.includes(pkg.id)}
                        onChange={() => togglePackage(pkg.id)}
                        className="mt-1 size-4 rounded border-ink-300 accent-teal-700"
                      />
                      <span>
                        <span className="font-semibold text-ink-950">{pkg.id}</span>
                        <span className="block text-xs text-ink-500">{pkg.shortTitle}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="h-11 bg-teal-700 text-white hover:bg-teal-800">
                <Save className="size-4" />
                초안 로컬 저장
              </Button>
              <p className="rounded-md bg-white p-3 text-xs leading-5 text-ink-500">
                v1 메모: 이 폼은 초안을 로컬 UI 상태에만 보관합니다. 실제 게시 전에는 관리자 경로 테이블이나 CMS에 저장하도록 연결해야 합니다.
              </p>
            </form>
          </aside>
        </div>
      </section>
    </Layout>
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
