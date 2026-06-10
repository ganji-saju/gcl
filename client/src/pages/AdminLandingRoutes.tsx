import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Database, ExternalLink, FilePlus2, ListChecks, RefreshCw, Save, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKIN_LANDING_PAGES, SKIN_PACKAGE_SKUS, type LandingLocale, type WedgeMarket } from "@/lib/wedgeData";
import { languageLabel, marketLabel, statusLabel } from "@/lib/adminLabels";
import {
  fetchPartnerMvpSnapshot,
  readAdminApiToken,
  upsertLandingRouteMvp,
  type LandingRouteStatus,
  type ManagedLandingRoute,
} from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

const defaultDraft: ManagedLandingRoute = {
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
  status: "draft",
  active: true,
};

const staticRoutes: ManagedLandingRoute[] = SKIN_LANDING_PAGES.map((page) => ({
  ...page,
  status: "published",
  source: "code",
  active: true,
}));

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function routeKey(route: Pick<ManagedLandingRoute, "locale" | "slug">) {
  return `${route.locale}:${route.slug}`;
}

function mergeRoutes(remoteRoutes: ManagedLandingRoute[], localDrafts: ManagedLandingRoute[]) {
  const merged = new Map<string, ManagedLandingRoute>();
  for (const route of staticRoutes) merged.set(routeKey(route), route);
  for (const route of remoteRoutes) merged.set(routeKey(route), route);
  for (const route of localDrafts) merged.set(routeKey(route), route);
  return Array.from(merged.values()).sort((a, b) => `${a.locale}-${a.slug}`.localeCompare(`${b.locale}-${b.slug}`));
}

function StatusBadge({ status }: { status: LandingRouteStatus }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-semibold",
        status === "published" && "border-teal-200 bg-teal-50 text-teal-800",
        status === "draft" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "paused" && "border-ink-200 bg-ink-50 text-ink-700",
        status === "archived" && "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function AdminLandingRoutes() {
  const [draft, setDraft] = useState<ManagedLandingRoute>(defaultDraft);
  const [localDrafts, setLocalDrafts] = useState<ManagedLandingRoute[]>([]);
  const [remoteRoutes, setRemoteRoutes] = useState<ManagedLandingRoute[]>([]);
  const [apiStatus, setApiStatus] = useState<"loading" | "live" | "static" | "saving" | "error">("loading");
  const [apiMessage, setApiMessage] = useState("Supabase 랜딩 경로 저장소를 확인 중입니다.");
  const [adminToken] = useState(() => readAdminApiToken());

  async function refreshRoutes(token = adminToken) {
    if (!token) {
      setApiStatus("static");
      setApiMessage("운영 토큰이 없어 코드에 포함된 기본 EN/JP route만 표시합니다.");
      return;
    }

    try {
      setApiStatus("loading");
      const snapshot = await fetchPartnerMvpSnapshot(token);
      setRemoteRoutes(snapshot.landingRoutes ?? []);
      const persistence = snapshot.meta?.adminPersistenceHealth;
      setApiStatus("live");
      setApiMessage(
        persistence?.ready
          ? "Supabase admin_landing_routes 저장소와 연결되었습니다."
          : "운영 API는 연결되었지만 admin persistence migration 적용 상태를 확인해야 합니다.",
      );
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "랜딩 경로 저장소를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void refreshRoutes();
  }, []);

  const routes = useMemo(() => mergeRoutes(remoteRoutes, localDrafts), [remoteRoutes, localDrafts]);

  const enCount = routes.filter((route) => route.locale === "en").length;
  const jpCount = routes.filter((route) => route.locale === "jp").length;
  const japanCount = routes.filter((route) => route.market === "japan").length;
  const taiwanCount = routes.filter((route) => route.market === "taiwan").length;
  const draftCount = routes.filter((route) => route.status === "draft").length;

  const updateDraft = <K extends keyof ManagedLandingRoute>(key: K, value: ManagedLandingRoute[K]) => {
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

  const submitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = normalizeSlug(draft.slug);
    if (!slug || !draft.title.trim() || !draft.intent.trim()) {
      setApiStatus("error");
      setApiMessage("slug, 검색 의도, 제목은 필수입니다.");
      return;
    }

    const nextRoute: ManagedLandingRoute = {
      ...draft,
      slug,
      status: "draft",
      source: adminToken ? "admin" : "local",
      active: true,
    };

    if (!adminToken) {
      setLocalDrafts((current) => [...current.filter((route) => routeKey(route) !== routeKey(nextRoute)), nextRoute]);
      setDraft(defaultDraft);
      setApiStatus("static");
      setApiMessage("운영 토큰이 없어 현재 브라우저 세션에만 초안을 보관했습니다.");
      return;
    }

    try {
      setApiStatus("saving");
      const snapshot = await upsertLandingRouteMvp(adminToken, nextRoute);
      setRemoteRoutes(snapshot.landingRoutes ?? []);
      setLocalDrafts([]);
      setDraft(defaultDraft);
      setApiStatus("live");
      setApiMessage("Supabase admin_landing_routes에 랜딩 초안을 저장했습니다.");
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "랜딩 초안 저장에 실패했습니다.");
    }
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
                공개 홈에 노출하지 않는 EN/JP 일본·대만 피부 패키지 랜딩 경로를 관리합니다. 승인된 기본 경로는 코드에서 렌더링하고,
                신규 초안은 Supabase 운영 테이블에 저장해 배포 전 검수 대상으로 분리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-ink-300 text-ink-800" onClick={() => void refreshRoutes()} disabled={apiStatus === "loading"}>
                <RefreshCw className={cn("size-4", apiStatus === "loading" && "animate-spin")} />
                새로고침
              </Button>
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

          <div
            className={cn(
              "mt-6 flex items-start gap-3 rounded-lg border p-4 text-sm",
              apiStatus === "live" && "border-teal-200 bg-teal-50 text-teal-900",
              apiStatus === "saving" && "border-amber-200 bg-amber-50 text-amber-900",
              apiStatus === "static" && "border-ink-200 bg-white text-ink-700",
              apiStatus === "loading" && "border-ink-200 bg-white text-ink-700",
              apiStatus === "error" && "border-rose-200 bg-rose-50 text-rose-900",
            )}
          >
            <Database className="mt-0.5 size-4 shrink-0" />
            <div>
              <div className="font-semibold">
                {apiStatus === "live" ? "DB 저장 연결됨" : apiStatus === "saving" ? "저장 중" : apiStatus === "error" ? "확인 필요" : "운영 저장소 상태"}
              </div>
              <div className="mt-1">{apiMessage}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {[
              ["전체 경로", routes.length],
              ["영어 / 일본어", `${enCount} / ${jpCount}`],
              ["일본 / 대만", `${japanCount} / ${taiwanCount}`],
              ["DB 초안", draftCount],
              ["DB 저장", remoteRoutes.length],
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
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">경로</th>
                    <th className="px-4 py-3">시장</th>
                    <th className="px-4 py-3">검색 의도</th>
                    <th className="px-4 py-3">패키지</th>
                    <th className="px-4 py-3">출처</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">열기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 bg-white">
                  {routes.map((route) => (
                    <tr key={`${route.source ?? "route"}-${route.locale}-${route.slug}`}>
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
                      <td className="px-4 py-3 text-ink-500">{route.source === "code" ? "승인 기본값" : "DB/admin"}</td>
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
                <Input value={draft.intent} onChange={(event) => updateDraft("intent", event.target.value)} placeholder="Korea skin package for Japan patients" />
              </Field>
              <Field label="제목">
                <Input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Landing page title" />
              </Field>
              <Field label="부제목">
                <textarea
                  value={draft.subtitle}
                  onChange={(event) => updateDraft("subtitle", event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  placeholder="환자에게 보여줄 가치 제안"
                />
              </Field>
              <Field label="검색 테마">
                <Input value={draft.searchTheme} onChange={(event) => updateDraft("searchTheme", event.target.value)} placeholder="Laser toning package" />
              </Field>
              <Field label="주요 버튼 문구">
                <Input value={draft.cta} onChange={(event) => updateDraft("cta", event.target.value)} placeholder="견적 요청" />
              </Field>
              <Field label="보조 버튼 문구">
                <Input value={draft.secondaryCta} onChange={(event) => updateDraft("secondaryCta", event.target.value)} placeholder="패키지 보기" />
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

              <Button type="submit" className="h-11 bg-teal-700 text-white hover:bg-teal-800" disabled={apiStatus === "saving"}>
                <Save className="size-4" />
                {apiStatus === "saving" ? "저장 중" : "초안 저장"}
              </Button>
              <p className="rounded-md bg-white p-3 text-xs leading-5 text-ink-500">
                저장된 초안은 공개 홈에 노출되지 않습니다. 실제 게시 전에는 콘텐츠 심의, 광고 문구 검수, 패키지 가격 범위, 병원 검증 상태를 확인해야 합니다.
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
