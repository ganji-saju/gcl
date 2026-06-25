import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const OPS_AUTH_STORAGE_KEY = "gcl_ops_auth:v1";

let opsClient: SupabaseClient | null = null;

export interface OpsEmailSession {
  accessToken: string;
  email: string;
  expiresAt: number | null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toOpsSession(session: Session | null): OpsEmailSession | null {
  if (!session?.access_token || !session.user.email) return null;
  return {
    accessToken: session.access_token,
    email: normalizeEmail(session.user.email),
    expiresAt: session.expires_at ?? null,
  };
}

export function isOpsEmailAuthConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getOpsAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 이메일 인증 환경변수가 설정되지 않았습니다.");
  }

  if (!opsClient) {
    opsClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: OPS_AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return opsClient;
}

function clearAuthCodeFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("type");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function exchangeRedirectCode() {
  if (typeof window === "undefined") return null;
  const code = new URL(window.location.href).searchParams.get("code");
  if (!code) return null;

  const { data, error } = await getOpsAuthClient().auth.exchangeCodeForSession(code);
  clearAuthCodeFromUrl();
  if (error) throw new Error(error.message);
  return toOpsSession(data.session);
}

export async function requestOpsEmailSignIn(email: string, redirectTo?: string) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("인증 메일을 받을 이메일 주소를 입력하세요.");
  }

  const { error } = await getOpsAuthClient().auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: redirectTo ?? window.location.href.split("#")[0],
      shouldCreateUser: true,
    },
  });

  if (error) throw new Error(error.message);
  return cleanEmail;
}

export async function verifyOpsEmailOtp(email: string, token: string) {
  const cleanEmail = normalizeEmail(email);
  const cleanToken = token.trim();
  if (!cleanEmail || !cleanToken) throw new Error("이메일과 인증 코드를 모두 입력하세요.");

  const { data, error } = await getOpsAuthClient().auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: "email",
  });

  if (error) throw new Error(error.message);
  return toOpsSession(data.session);
}

export async function getCurrentOpsEmailSession() {
  if (!isOpsEmailAuthConfigured()) return null;
  let redirectError: Error | null = null;
  const redirectSession = await exchangeRedirectCode().catch((error) => {
    redirectError = error instanceof Error ? error : new Error("인증 링크를 처리하지 못했습니다.");
    return null;
  });
  if (redirectSession) return redirectSession;

  const { data, error } = await getOpsAuthClient().auth.getSession();
  if (error) throw new Error(error.message);
  const session = toOpsSession(data.session);
  if (session) return session;
  if (redirectError) throw redirectError;
  return null;
}

export async function signOutOpsEmail() {
  if (!isOpsEmailAuthConfigured()) return;
  const { error } = await getOpsAuthClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export function onOpsAuthStateChange(callback: (event: AuthChangeEvent, session: OpsEmailSession | null) => void) {
  if (!isOpsEmailAuthConfigured()) return () => {};
  const {
    data: { subscription },
  } = getOpsAuthClient().auth.onAuthStateChange((event, session) => {
    callback(event, toOpsSession(session));
  });
  return () => subscription.unsubscribe();
}
