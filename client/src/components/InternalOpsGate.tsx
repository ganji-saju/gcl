import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Loader2, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearAdminApiToken,
  fetchPartnerMvpSnapshot,
  normalizeOpsRole,
  opsRoleLabel,
  readAdminApiToken,
  readOpsRole,
  saveOpsSession,
  type OpsRole,
} from "@/lib/partnerMvpApi";

interface InternalOpsGateProps {
  children: ReactNode;
  title?: string;
  allowedRoles?: OpsRole[];
}

type GateStatus = "idle" | "validating" | "valid" | "invalid";

const ROLE_OPTIONS: Array<{ role: OpsRole; label: string; description: string }> = [
  { role: "admin", label: "관리자", description: "전체 케이스, 배정, 견적, 결제 설정" },
  { role: "partner", label: "파트너", description: "배정된 케이스와 병원 후보 선택" },
  { role: "provider", label: "병원", description: "견적 요청 확인과 견적 제출" },
];

function roleAllowed(role: OpsRole, allowedRoles: OpsRole[]) {
  return role === "admin" || allowedRoles.includes(role);
}

export default function InternalOpsGate({ children, title = "내부 운영 접근", allowedRoles = ["admin"] }: InternalOpsGateProps) {
  const allowedRoleSet = useMemo(() => new Set<OpsRole>(["admin", ...allowedRoles]), [allowedRoles]);
  const [token, setToken] = useState(() => readAdminApiToken());
  const [input, setInput] = useState(() => readAdminApiToken());
  const [selectedRole, setSelectedRole] = useState<OpsRole>(() => readOpsRole());
  const [validatedRole, setValidatedRole] = useState<OpsRole | null>(null);
  const [status, setStatus] = useState<GateStatus>(() => (readAdminApiToken() ? "validating" : "idle"));
  const [message, setMessage] = useState("");

  const validateSession = useCallback(
    async (nextToken: string) => {
      const cleanToken = nextToken.trim();
      if (!cleanToken) {
        setStatus("idle");
        setMessage("");
        return;
      }

      setStatus("validating");
      setMessage("운영 토큰을 서버에서 검증하는 중입니다.");

      try {
        const snapshot = await fetchPartnerMvpSnapshot(cleanToken);
        const serverRole = normalizeOpsRole(snapshot.meta?.role);

        if (!roleAllowed(serverRole, allowedRoles)) {
          throw new Error(`${opsRoleLabel(serverRole)} 권한은 이 화면에 접근할 수 없습니다.`);
        }

        saveOpsSession(cleanToken, serverRole);
        setToken(cleanToken);
        setInput(cleanToken);
        setSelectedRole(serverRole);
        setValidatedRole(serverRole);
        setStatus("valid");
        setMessage("운영 접근이 승인되었습니다.");
      } catch (error) {
        clearAdminApiToken();
        setToken("");
        setValidatedRole(null);
        setStatus("invalid");
        setMessage(error instanceof Error ? error.message : "운영 토큰 검증에 실패했습니다.");
      }
    },
    [allowedRoles],
  );

  useEffect(() => {
    if (token) void validateSession(token);
  }, [token, validateSession]);

  function disconnect() {
    clearAdminApiToken();
    setInput("");
    setToken("");
    setValidatedRole(null);
    setStatus("idle");
    setMessage("");
  }

  if (status === "valid" && validatedRole) {
    return (
      <>
        <div className="border-b border-teal-200 bg-teal-50">
          <div className="container-wide flex flex-col gap-2 py-3 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4" />
              서버 검증 완료: {opsRoleLabel(validatedRole)} 권한으로 접속 중
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

  const selectedRoleAllowed = roleAllowed(selectedRole, allowedRoles);

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
                환자, 파트너, 병원 운영 데이터는 서버에서 승인된 운영 토큰과 역할이 확인된 뒤에만 열립니다.
              </p>
            </div>
          </div>

          {status === "validating" && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">
              <Loader2 className="size-4 animate-spin" />
              {message}
            </div>
          )}

          {status === "invalid" && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-coral-200 bg-coral-50 p-3 text-sm leading-6 text-coral-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void validateSession(input);
            }}
          >
            <div className="grid gap-2">
              <div className="text-sm font-semibold text-ink-800">접근 역할</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLE_OPTIONS.map((option) => {
                  const disabled = !allowedRoleSet.has(option.role);
                  const selected = selectedRole === option.role;
                  return (
                    <button
                      key={option.role}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedRole(option.role)}
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
              {opsRoleLabel(selectedRole)} 운영 토큰
              <Input
                type="password"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={selectedRole === "admin" ? "ADMIN_API_TOKEN" : selectedRole === "partner" ? "PARTNER_API_TOKEN 또는 scoped token" : "PROVIDER_API_TOKEN 또는 scoped token"}
                className="h-11"
                autoComplete="current-password"
              />
            </label>

            <Button
              type="submit"
              disabled={!input.trim() || !selectedRoleAllowed || status === "validating"}
              className="h-11 bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300"
            >
              {status === "validating" && <Loader2 className="size-4 animate-spin" />}
              서버 검증 후 운영 화면 열기
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
