import {
  createClient,
  type AuthChangeEvent,
  type EmailOtpType,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const opsAuthSiteUrl = import.meta.env.VITE_OPS_AUTH_SITE_URL as
  | string
  | undefined;
const OPS_AUTH_STORAGE_KEY = "gcl_ops_auth:v1";
const AUTH_REDIRECT_PARAM_KEYS = [
  "code",
  "type",
  "error",
  "error_code",
  "error_description",
  "sb",
  "token_hash",
] as const;
const AUTH_HASH_TOKEN_PARAM_KEYS = [
  "access_token",
  "expires_at",
  "expires_in",
  "refresh_token",
  "token_type",
] as const;

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

  AUTH_REDIRECT_PARAM_KEYS.forEach(key => url.searchParams.delete(key));

  const hashKeys = [...AUTH_REDIRECT_PARAM_KEYS, ...AUTH_HASH_TOKEN_PARAM_KEYS];
  if (url.hash) {
    const hashValue = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hashValue);
    const hasAuthHash = hashKeys.some(key => hashParams.has(key));
    if (!hasAuthHash) {
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
      return;
    }

    hashKeys.forEach(key => hashParams.delete(key));
    const cleanHash = hashParams.toString();
    url.hash = cleanHash ? `#${cleanHash}` : "";
  }

  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

function readAuthRedirectError() {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  );
  const code =
    hashParams.get("error_code") ?? url.searchParams.get("error_code");
  const description =
    hashParams.get("error_description") ??
    url.searchParams.get("error_description") ??
    hashParams.get("error") ??
    url.searchParams.get("error");

  if (!code && !description) return null;

  if (code === "otp_expired") {
    return new Error(
      "인증 메일 링크가 만료되었거나 이미 사용되었습니다. 최신 인증 메일에서 링크를 한 번만 열어 주세요. 새 인증 링크를 다시 요청할 수 있습니다."
    );
  }

  return new Error(
    description?.trim() ||
      "인증 링크를 처리하지 못했습니다. 새 인증 링크를 다시 요청해 주세요."
  );
}

function normalizeSiteUrl(siteUrl?: string) {
  const cleanSiteUrl = siteUrl?.trim();
  if (!cleanSiteUrl) return null;

  try {
    const url = new URL(cleanSiteUrl);
    url.hash = "";
    url.search = "";
    return url.origin;
  } catch {
    return null;
  }
}

function getCurrentOpsPath() {
  if (typeof window === "undefined") return "/admin/ops-health";
  return `${window.location.pathname}${window.location.search}`;
}

export function getOpsAuthRedirectUrl(redirectTo?: string) {
  if (redirectTo) return redirectTo;

  const configuredOrigin = normalizeSiteUrl(opsAuthSiteUrl);
  if (configuredOrigin) {
    return new URL(getCurrentOpsPath(), configuredOrigin).toString();
  }

  if (typeof window === "undefined") return undefined;
  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
}

export function getSafeOpsRedirectPath(redirectTo?: string | null) {
  if (typeof window === "undefined") return "/admin";
  if (!redirectTo) return "/admin";

  try {
    const redirectUrl = new URL(redirectTo, window.location.origin);
    const allowedOrigins = new Set([window.location.origin]);
    const configuredOrigin = normalizeSiteUrl(opsAuthSiteUrl);
    if (configuredOrigin) allowedOrigins.add(configuredOrigin);
    if (!allowedOrigins.has(redirectUrl.origin)) return "/admin";
    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return "/admin";
  }
}

async function exchangeRedirectCode() {
  if (typeof window === "undefined") return null;
  const redirectError = readAuthRedirectError();
  if (redirectError) {
    clearAuthCodeFromUrl();
    throw redirectError;
  }

  const code = new URL(window.location.href).searchParams.get("code");
  if (!code) return null;

  const { data, error } =
    await getOpsAuthClient().auth.exchangeCodeForSession(code);
  clearAuthCodeFromUrl();
  if (error) throw new Error(error.message);
  return toOpsSession(data.session);
}

export async function verifyOpsEmailTokenHash(
  tokenHash: string,
  type: string,
  redirectTo?: string | null
) {
  const cleanTokenHash = tokenHash.trim();
  if (!cleanTokenHash)
    throw new Error("인증 링크 정보가 없습니다. 새 인증 메일을 요청해 주세요.");

  const otpType = (type || "email") as EmailOtpType;
  const { data, error } = await getOpsAuthClient().auth.verifyOtp({
    token_hash: cleanTokenHash,
    type: otpType,
  });

  if (error) {
    if ("code" in error && error.code === "otp_expired") {
      throw new Error(
        "인증 메일 링크가 만료되었거나 이미 사용되었습니다. 새 인증 메일을 요청한 뒤 최신 링크로 다시 시도해 주세요."
      );
    }
    throw new Error(error.message);
  }

  const session = toOpsSession(data.session);
  if (!session)
    throw new Error(
      "인증 세션을 만들지 못했습니다. 새 인증 메일을 요청해 주세요."
    );

  return {
    session,
    redirectPath: getSafeOpsRedirectPath(redirectTo),
  };
}

export async function requestOpsEmailSignIn(
  email: string,
  redirectTo?: string
) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("인증 메일을 받을 이메일 주소를 입력하세요.");
  }

  const { error } = await getOpsAuthClient().auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: getOpsAuthRedirectUrl(redirectTo),
      shouldCreateUser: true,
    },
  });

  if (error) throw new Error(error.message);
  return cleanEmail;
}

export async function getCurrentOpsEmailSession() {
  if (!isOpsEmailAuthConfigured()) return null;
  let redirectError: Error | null = null;
  const redirectSession = await exchangeRedirectCode().catch(error => {
    redirectError =
      error instanceof Error
        ? error
        : new Error("인증 링크를 처리하지 못했습니다.");
    return null;
  });
  if (redirectSession) return redirectSession;

  const { data, error } = await getOpsAuthClient().auth.getSession();
  if (error) throw new Error(error.message);
  const session = toOpsSession(data.session);
  if (session) {
    clearAuthCodeFromUrl();
    return session;
  }
  if (redirectError) throw redirectError;
  return null;
}

export async function signOutOpsEmail() {
  if (!isOpsEmailAuthConfigured()) return;
  const { error } = await getOpsAuthClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export function onOpsAuthStateChange(
  callback: (event: AuthChangeEvent, session: OpsEmailSession | null) => void
) {
  if (!isOpsEmailAuthConfigured()) return () => {};
  const {
    data: { subscription },
  } = getOpsAuthClient().auth.onAuthStateChange((event, session) => {
    callback(event, toOpsSession(session));
  });
  return () => subscription.unsubscribe();
}
