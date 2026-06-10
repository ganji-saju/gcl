import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAdminApiToken, opsRoleLabel, readAdminApiToken, readOpsRole, saveOpsSession, type OpsRole } from "@/lib/partnerMvpApi";

interface InternalOpsGateProps {
  children: ReactNode;
  title?: string;
  allowedRoles?: OpsRole[];
}

const ROLE_OPTIONS: Array<{ role: OpsRole; label: string; description: string }> = [
  { role: "admin", label: "관리자", description: "전체 케이스, 배정, 견적, 결제 설정" },
  { role: "partner", label: "파트너", description: "배정된 케이스와 병원 후보 선택" },
  { role: "provider", label: "병원", description: "견적 요청 확인과 견적 제출" },
];

function roleAllowed(role: OpsRole, allowedRoles: OpsRole[]) {
  return role === "admin" || allowedRoles.includes(role);
}

export default function InternalOpsGate({ children, title = "내부 운영 접근", allowedRoles = ["admin"] }: InternalOpsGateProps) {
  const [token, setToken] = useState(() => readAdminApiToken());
  const [input, setInput] = useState(() => readAdminApiToken());
  const [role, setRole] = useState<OpsRole>(() => readOpsRole());
  const hasAccess = Boolean(token && roleAllowed(role, allowedRoles));

  function connect() {
    const nextToken = input.trim();
    if (!nextToken) return;
    if (!roleAllowed(role, allowedRoles)) return;
    saveOpsSession(nextToken, role);
    setToken(nextToken);
  }

  function disconnect() {
    clearAdminApiToken();
    setInput("");
    setToken("");
  }

  if (hasAccess) {
    return (
      <>
        <div className="border-b border-teal-200 bg-teal-50">
          <div className="container-wide flex flex-col gap-2 py-3 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4" />
              {opsRoleLabel(role)} 운영 토큰 연결됨
            </div>
            <Button type="button" variant="outline" size="sm" onClick={disconnect} className="border-teal-300 bg-white text-teal-900 hover:bg-teal-100">
              연결 해제
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <Layout>
      <section className="grid min-h-[72vh] place-items-center bg-ink-50 px-4 py-16">
        <div className="w-full max-w-xl rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md bg-ink-950 text-white">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-ink-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                환자, 파트너, 병원 운영 데이터는 역할별 연결 토큰을 입력한 뒤에만 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {token && !hasAccess && (
            <div className="mb-4 rounded-md border border-coral-200 bg-coral-50 p-3 text-sm leading-6 text-coral-900">
              현재 저장된 {opsRoleLabel(role)} 역할은 이 화면에 접근할 수 없습니다. 허용된 역할로 다시 연결하세요.
            </div>
          )}

          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              connect();
            }}
          >
            <div className="grid gap-2">
              <div className="text-sm font-semibold text-ink-800">접근 역할</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_OPTIONS.map((option) => {
                  const disabled = !roleAllowed(option.role, allowedRoles);
                  const selected = role === option.role;
                  return (
                    <button
                      key={option.role}
                      type="button"
                      disabled={disabled}
                      onClick={() => setRole(option.role)}
                      className={[
                        "min-h-24 rounded-md border p-3 text-left transition-colors",
                        selected ? "border-teal-400 bg-teal-50 text-teal-950" : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
                        disabled ? "cursor-not-allowed opacity-45" : "",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-800">
              {opsRoleLabel(role)} 연결 토큰
              <Input
                type="password"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={role === "admin" ? "ADMIN_API_TOKEN" : role === "partner" ? "PARTNER_API_TOKEN" : "PROVIDER_API_TOKEN"}
                className="h-11"
              />
            </label>
            <Button type="submit" disabled={!input.trim() || !roleAllowed(role, allowedRoles)} className="h-11 bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300">
              운영 화면 열기
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-coral-200 bg-coral-50 p-3 text-sm leading-6 text-coral-900">
            토큰은 이 브라우저의 로컬 저장소에만 보관됩니다. 공유 PC에서는 작업 후 반드시 연결을 해제하세요.
          </div>

          <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900">
            공개 사이트로 돌아가기
          </Link>
        </div>
      </section>
    </Layout>
  );
}
