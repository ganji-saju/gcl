import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Loader2,
  LockKeyhole,
  TriangleAlert,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifyOpsEmailTokenHash } from "@/lib/opsAuth";

type ConfirmStatus = "ready" | "verifying" | "done" | "error";

function readConfirmParams() {
  if (typeof window === "undefined") {
    return { tokenHash: "", type: "email", redirectTo: "/admin" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    tokenHash: params.get("token_hash") ?? "",
    type: params.get("type") ?? "email",
    redirectTo: params.get("redirect_to") ?? "/admin",
  };
}

export default function AuthConfirm() {
  const confirmParams = useMemo(readConfirmParams, []);
  const [status, setStatus] = useState<ConfirmStatus>(() =>
    confirmParams.tokenHash ? "ready" : "error"
  );
  const [message, setMessage] = useState(() =>
    confirmParams.tokenHash
      ? "메일 인증을 완료하려면 아래 버튼을 눌러 주세요."
      : "인증 링크 정보가 없습니다. 새 인증 메일을 요청해 주세요."
  );

  async function confirmEmailLink() {
    setStatus("verifying");
    setMessage("인증 링크를 확인하고 있습니다.");

    try {
      const result = await verifyOpsEmailTokenHash(
        confirmParams.tokenHash,
        confirmParams.type,
        confirmParams.redirectTo
      );
      setStatus("done");
      setMessage("인증이 완료되었습니다. 운영 화면으로 이동합니다.");
      window.location.replace(result.redirectPath);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "인증 링크를 처리하지 못했습니다. 새 인증 메일을 요청해 주세요."
      );
    }
  }

  const busy = status === "verifying";

  return (
    <Layout>
      <section className="grid min-h-[72vh] place-items-center bg-ink-50 px-4 py-16">
        <div className="w-full max-w-xl rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md bg-ink-950 text-white">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-ink-950">
                메일 링크 확인
              </h1>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                보안상 링크를 열기만 해서는 로그인하지 않습니다.
              </p>
            </div>
          </div>

          <Alert
            className={[
              "mb-4",
              status === "error"
                ? "border-coral-200 bg-coral-50 text-coral-900"
                : "border-teal-200 bg-teal-50 text-teal-900",
            ].join(" ")}
          >
            {status === "error" ? (
              <TriangleAlert className="size-4" />
            ) : status === "done" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <LockKeyhole className="size-4" />
            )}
            <AlertTitle>
              {status === "error"
                ? "인증 실패"
                : status === "done"
                  ? "인증 완료"
                  : "인증 대기"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Button
              type="button"
              disabled={busy || status === "done" || !confirmParams.tokenHash}
              onClick={() => void confirmEmailLink()}
              className="h-11 bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              인증 완료하기
            </Button>
            <Button type="button" variant="outline" asChild className="h-11">
              <Link href="/admin">로그인 화면</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
