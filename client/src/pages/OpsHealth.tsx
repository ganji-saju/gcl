import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Activity, ArrowRight, BellRing, CreditCard, Database, RefreshCw, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { fetchPartnerMvpSnapshot, opsRoleLabel, readAdminApiToken, readOpsRole, type PartnerMvpSnapshot } from "@/lib/partnerMvpApi";
import { cn } from "@/lib/utils";

type HealthStatus = "loading" | "ready" | "error";

function MetricCard({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "good" | "warn" }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "good" && "border-teal-200 bg-teal-50",
        tone === "warn" && "border-coral-200 bg-coral-50",
        tone === "neutral" && "border-ink-200 bg-white",
      )}
    >
      <div className="text-xs font-bold uppercase text-ink-500">{label}</div>
      <div className="mt-2 font-serif text-3xl text-ink-950">{value}</div>
    </div>
  );
}

function CheckRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
      <div>
        <div className="font-semibold text-ink-950">{label}</div>
        <div className="mt-1 text-sm text-ink-500">{detail}</div>
      </div>
      <span className={cn("rounded-md border px-2 py-1 text-xs font-bold", ok ? "border-teal-200 bg-teal-50 text-teal-800" : "border-coral-200 bg-coral-50 text-coral-800")}>
        {ok ? "정상" : "확인 필요"}
      </span>
    </div>
  );
}

export default function OpsHealth() {
  const [snapshot, setSnapshot] = useState<PartnerMvpSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [message, setMessage] = useState("운영 연결 상태를 확인하는 중...");
  const token = useMemo(() => readAdminApiToken(), []);
  const role = useMemo(() => readOpsRole(), []);

  async function refresh() {
    if (!token) {
      setStatus("error");
      setMessage("관리자 연결 토큰이 없습니다.");
      return;
    }

    setStatus("loading");
    setMessage("Supabase 운영 데이터를 확인하는 중...");
    try {
      const nextSnapshot = await fetchPartnerMvpSnapshot(token);
      setSnapshot(nextSnapshot);
      setStatus("ready");
      setMessage("운영 연결이 정상입니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "운영 연결 확인에 실패했습니다.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const meta = snapshot?.meta;
  const partnerRequestCount = meta?.partnerRequestCount ?? snapshot?.cases?.length ?? 0;
  const quoteRequestCount = meta?.quoteRequestCount ?? snapshot?.providerQuoteRequests?.length ?? 0;
  const quoteResponseCount = meta?.quoteResponseCount ?? snapshot?.quotes?.length ?? 0;
  const generatedAt = meta?.generatedAt ? new Date(meta.generatedAt).toLocaleString("ko-KR") : "-";
  const activeRole = meta?.role ?? role;
  const roleTokensReady = Boolean(meta?.roleTokensConfigured?.admin && (meta.roleTokensConfigured.partner || meta.roleTokensConfigured.provider));
  const accountScopingReady = Boolean(meta?.roleTokensConfigured?.partnerScoped || meta?.roleTokensConfigured?.providerScoped);
  const notificationReady = Boolean(meta?.notificationDispatchConfigured);
  const stripeReady = Boolean(meta?.stripeConfigured);

  return (
    <Layout>
      <section className="border-b border-ink-200 bg-white">
        <div className="container-wide py-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Activity className="size-4" />
                Phase 3 운영 안정화
              </div>
              <h1 className="font-serif text-5xl text-ink-950">운영 상태 점검</h1>
              <p className="mt-3 max-w-2xl text-ink-600">
                관리자 API, Supabase 데이터, 파트너 요청, 병원 견적 요청 흐름이 실제 운영 가능한 상태인지 확인합니다.
              </p>
            </div>
            <Button type="button" onClick={refresh} disabled={status === "loading"} className="bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300">
              <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} />
              다시 확인
            </Button>
          </div>
        </div>
      </section>

      <section className="section-padding bg-ink-50">
        <div className="container-wide grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-6">
            <div className={cn("rounded-lg border p-4", status === "ready" ? "border-teal-200 bg-teal-50" : status === "error" ? "border-coral-200 bg-coral-50" : "border-ink-200 bg-white")}>
              <div className="flex items-center gap-2 font-semibold text-ink-950">
                {status === "error" ? <TriangleAlert className="size-5 text-coral-700" /> : <ShieldCheck className="size-5 text-teal-700" />}
                {message}
              </div>
              <p className="mt-2 text-sm text-ink-600">마지막 점검 시각: {generatedAt}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="파트너 서비스 요청" value={partnerRequestCount} tone={partnerRequestCount > 0 ? "good" : "warn"} />
              <MetricCard label="병원 견적 요청" value={quoteRequestCount} tone={quoteRequestCount > 0 ? "good" : "warn"} />
              <MetricCard label="견적 응답" value={quoteResponseCount} tone={quoteResponseCount > 0 ? "good" : "neutral"} />
              <MetricCard label="현재 접근 역할" value={opsRoleLabel(activeRole)} tone={status === "ready" ? "good" : "neutral"} />
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-ink-950">
                <Database className="size-5 text-teal-700" />
                운영 체크리스트
              </div>
              <CheckRow label="관리자 API 연결" ok={status === "ready"} detail="ADMIN_API_TOKEN과 서버 API가 응답하는지 확인합니다." />
              <CheckRow label="Supabase 파트너 요청 테이블" ok={partnerRequestCount > 0} detail="상담 신청에서 생성된 파트너 서비스 요청이 조회되어야 합니다." />
              <CheckRow label="파트너/병원 기준 데이터" ok={Boolean(meta?.hasDbPartners && meta?.hasDbProviders)} detail="운영 파트너와 병원 후보 데이터가 Supabase에 등록되어야 합니다." />
              <CheckRow label="견적 요청 흐름" ok={quoteRequestCount > 0} detail="코디네이터가 병원 후보를 골라 견적 요청을 생성하면 증가합니다." />
              <CheckRow label="역할별 운영 토큰" ok={roleTokensReady} detail="ADMIN_API_TOKEN 외에 PARTNER_API_TOKEN 또는 PROVIDER_API_TOKEN을 분리해 둘 수 있습니다." />
              <CheckRow label="계정별 데이터 스코프" ok={accountScopingReady} detail="PARTNER_TOKEN_MAP 또는 PROVIDER_TOKEN_MAP을 설정하면 파트너/병원별 데이터 범위가 제한됩니다." />
              <CheckRow label="알림 발송 게이트웨이" ok={notificationReady} detail="NOTIFICATION_WEBHOOK_URL이 있으면 알림 큐 저장 후 외부 발송 게이트웨이로 전달합니다." />
              <CheckRow label="Stripe 예약금 결제" ok={stripeReady} detail={`STRIPE_SECRET_KEY 기준으로 예약금 Checkout 세션을 생성합니다. 현재 모드: ${meta?.paymentMode ?? "확인 전"}`} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <UsersRound className="size-4 text-teal-700" />
                  권한 분리
                </div>
                <div className="text-sm leading-6 text-ink-600">
                  관리자 전체 접근, 파트너 후보 선택, 병원 견적 제출 권한이 API에서 분리되었습니다.
                </div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <BellRing className="size-4 text-teal-700" />
                  알림 큐
                </div>
                <div className="text-sm leading-6 text-ink-600">
                  견적 안내 알림을 아웃박스에 저장하고, 웹훅이 있으면 발송 게이트웨이로 전달합니다.
                </div>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <CreditCard className="size-4 text-teal-700" />
                  예약금 결제
                </div>
                <div className="text-sm leading-6 text-ink-600">
                  Stripe Checkout 세션 생성 후 링크를 운영 화면에서 열 수 있습니다.
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-ink-200 bg-white p-5">
            <h2 className="font-serif text-2xl text-ink-950">다음 운영 작업</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/admin/cases">
                <Button variant="outline" className="w-full justify-between border-ink-300 text-ink-800">
                  케이스 보드 열기
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/partner/cases">
                <Button variant="outline" className="w-full justify-between border-ink-300 text-ink-800">
                  파트너 보드 열기
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/provider/quotes">
                <Button variant="outline" className="w-full justify-between border-ink-300 text-ink-800">
                  병원 견적 데스크 열기
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-5 rounded-md border border-coral-200 bg-coral-50 p-3 text-sm leading-6 text-coral-900">
              운영 전에는 파트너/병원별 실제 토큰 맵, 알림 발송 웹훅, Stripe Secret Key를 Vercel 환경변수에 넣고 다시 점검하세요.
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
