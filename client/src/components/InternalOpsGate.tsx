import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearAdminApiToken,
  fetchPartnerMvpSnapshot,
  normalizeOpsRole,
  opsRoleLabel,
  readAdminApiToken,
  readOpsEmail,
  saveOpsSession,
  type OpsRole,
} from "@/lib/partnerMvpApi";
import {
  getCurrentOpsEmailSession,
  isOpsEmailAuthConfigured,
  onOpsAuthStateChange,
  requestOpsEmailSignIn,
  signOutOpsEmail,
  verifyOpsEmailOtp,
  type OpsEmailSession,
} from "@/lib/opsAuth";

interface InternalOpsGateProps {
  children: ReactNode;
  title?: string;
  allowedRoles?: OpsRole[];
  allowLocalDemo?: boolean;
}

type GateStatus = "booting" | "idle" | "sending" | "sent" | "validating" | "valid" | "invalid";

function roleAllowed(role: OpsRole, allowedRoles: OpsRole[]) {
  return role === "admin" || allowedRoles.includes(role);
}

export default function InternalOpsGate({ children, title = "내부 운영 접근", allowedRoles = ["admin"], allowLocalDemo = false }: InternalOpsGateProps) {
  const validationRunRef = useRef(0);
  const [token, setToken] = useState(() => readAdminApiToken());
  const [email, setEmail] = useState(() => readOpsEmail());
  const [code, setCode] = useState("");
  const [validatedEmail, setValidatedEmail] = useState(() => readOpsEmail());
  const [validatedRole, setValidatedRole] = useState<OpsRole | null>(null);
  const [status, setStatus] = useState<GateStatus>(() => (readAdminApiToken() ? "validating" : "booting"));
  const [message, setMessage] = useState("이메일 인증 세션을 확인하는 중입니다.");

  const allowedRoleLabel = useMemo(() => {
    const roles = Array.from(new Set<OpsRole>(["admin", ...allowedRoles]));
    return roles.map(opsRoleLabel).join(", ");
  }, [allowedRoles]);

  const validateSession = useCallback(
    async (session: OpsEmailSession | null) => {
      const runId = validationRunRef.current + 1;
      validationRunRef.current = runId;

      if (!session?.accessToken) {
        setToken("");
        setValidatedRole(null);
        setStatus("idle");
        setMessage("");
        return;
      }

      setStatus("validating");
      setMessage("이메일 인증 세션을 서버에서 검증하는 중입니다.");

      try {
        const snapshot = await fetchPartnerMvpSnapshot(session.accessToken);
        if (runId !== validationRunRef.current) return;

        const serverRole = normalizeOpsRole(snapshot.meta?.role);
        const serverEmail = snapshot.meta?.authEmail ?? session.email;

        if (!roleAllowed(serverRole, allowedRoles)) {
          throw new Error(`${opsRoleLabel(serverRole)} 권한은 이 화면에 접근할 수 없습니다.`);
        }

        saveOpsSession(session.accessToken, serverRole, serverEmail);
        setToken(session.accessToken);
        setEmail(serverEmail ?? session.email);
        setValidatedEmail(serverEmail ?? session.email);
        setValidatedRole(serverRole);
        setStatus("valid");
        setMessage("이메일 인증이 승인되었습니다.");
      } catch (error) {
        if (runId !== validationRunRef.current) return;
        clearAdminApiToken();
        setToken("");
        setValidatedRole(null);
        setStatus("invalid");
        setMessage(error instanceof Error ? error.message : "이메일 인증 검증에 실패했습니다.");
      }
    },
    [allowedRoles],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!isOpsEmailAuthConfigured()) {
        clearAdminApiToken();
        if (!mounted) return;
        setToken("");
        setStatus("invalid");
        setMessage("Supabase 이메일 인증 환경변수가 설정되지 않았습니다.");
        return;
      }

      try {
        const session = await getCurrentOpsEmailSession();
        if (!mounted) return;
        if (session) await validateSession(session);
        else {
          clearAdminApiToken();
          setToken("");
          setStatus("idle");
          setMessage("");
        }
      } catch (error) {
        if (!mounted) return;
        setStatus("invalid");
        setMessage(error instanceof Error ? error.message : "이메일 인증 세션을 확인하지 못했습니다.");
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [validateSession]);

  useEffect(() => {
    return onOpsAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearAdminApiToken();
        setToken("");
        setValidatedRole(null);
        setStatus("idle");
        setMessage("");
        return;
      }

      if (session) void validateSession(session);
    });
  }, [validateSession]);

  async function sendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("인증 메일을 보내는 중입니다.");

    try {
      const cleanEmail = await requestOpsEmailSignIn(email);
      setEmail(cleanEmail);
      setCode("");
      setStatus("sent");
      setMessage("인증 메일을 보냈습니다. 메일의 로그인 링크를 열거나 6자리 코드를 입력하세요.");
    } catch (error) {
      setStatus("invalid");
      setMessage(error instanceof Error ? error.message : "인증 메일을 보내지 못했습니다.");
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("validating");
    setMessage("인증 코드를 확인하는 중입니다.");

    try {
      const session = await verifyOpsEmailOtp(email, code);
      if (!session) throw new Error("인증 세션을 만들지 못했습니다.");
      await validateSession(session);
    } catch (error) {
      setStatus("invalid");
      setMessage(error instanceof Error ? error.message : "인증 코드 확인에 실패했습니다.");
    }
  }

  function disconnect() {
    clearAdminApiToken();
    setCode("");
    setToken("");
    setValidatedRole(null);
    setStatus("idle");
    setMessage("");
    void signOutOpsEmail().catch(() => undefined);
  }

  if (allowLocalDemo && import.meta.env.DEV && !token && (status === "idle" || status === "invalid")) {
    return (
      <>
        <div className="border-b border-coral-200 bg-coral-50">
          <div className="container-wide flex items-center gap-2 py-3 text-sm font-semibold text-coral-900">
            <TriangleAlert className="size-4" />
            로컬 데모 모드: 서버 운영 데이터는 연결하지 않았습니다.
          </div>
        </div>
        {children}
      </>
    );
  }

  if (status === "valid" && validatedRole) {
    return (
      <>
        <div className="border-b border-teal-200 bg-teal-50">
          <div className="container-wide flex flex-col gap-2 py-3 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4" />
              서버 검증 완료: {validatedEmail || email} / {opsRoleLabel(validatedRole)}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={disconnect} className="border-teal-300 bg-white text-teal-900 hover:bg-teal-100">
              로그아웃
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  const busy = status === "booting" || status === "sending" || status === "validating";
  const emailReady = email.trim().includes("@");
  const codeReady = code.trim().length >= 6;

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
                등록된 운영 이메일로 인증하면 서버가 관리자, 파트너, 병원 권한을 자동으로 확인합니다.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={[
                "mb-4 flex items-start gap-2 rounded-md border p-3 text-sm leading-6",
                status === "invalid" ? "border-coral-200 bg-coral-50 text-coral-900" : "border-teal-200 bg-teal-50 text-teal-900",
              ].join(" ")}
            >
              {busy ? <Loader2 className="mt-1 size-4 shrink-0 animate-spin" /> : status === "invalid" ? <TriangleAlert className="mt-1 size-4 shrink-0" /> : <ShieldCheck className="mt-1 size-4 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <form className="grid gap-3" onSubmit={sendEmail}>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-800">
              운영 이메일
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops@example.com"
                className="h-11"
                autoComplete="email"
              />
            </label>

            <Button type="submit" disabled={!emailReady || busy} className="h-11 bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300">
              {status === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              인증 메일 보내기
            </Button>
          </form>

          <form className="mt-4 grid gap-3" onSubmit={verifyCode}>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-800">
              인증 코드
              <Input
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\s+/g, ""))}
                placeholder="123456"
                className="h-11"
                autoComplete="one-time-code"
              />
            </label>

            <Button type="submit" variant="outline" disabled={!emailReady || !codeReady || busy} className="h-11 border-ink-300 text-ink-800 disabled:bg-ink-100">
              {status === "validating" ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              코드 확인 후 운영 화면 열기
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-ink-200 bg-ink-50 p-3 text-sm leading-6 text-ink-600">
            허용 역할: {allowedRoleLabel}. 공유 PC에서는 작업 후 로그아웃하세요.
          </div>

          <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900">
            공개 사이트로 돌아가기
          </Link>
        </div>
      </section>
    </Layout>
  );
}
