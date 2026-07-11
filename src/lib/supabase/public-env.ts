/**
 * =============================================================================
 * Supabase 공개 환경변수 (클라이언트 전달용)
 * -----------------------------------------------------------------------------
 * Next.js는 `process.env.NEXT_PUBLIC_*` 를 **빌드 시** 문자열로 치환한다.
 *
 * 주의:
 * - `process.env.NEXT_PUBLIC_X?.trim()` 처럼 optional chaining을 붙이면
 *   Turbopack/Webpack이 치환에 실패할 수 있다.
 * - URL에 `/auth/v1` · `/rest/v1` 이 붙어 있으면
 *   최종 요청이 `.../auth/v1/auth/v1/token` 이 되어
 *   "Invalid path specified in request URL" 이 난다.
 *   → 항상 origin(https://xxx.supabase.co) 만 넘긴다.
 * =============================================================================
 */

function readRawEnv(value: string | undefined): string {
  if (typeof value !== "string") return "";
  // Vercel에 따옴표까지 붙여 넣은 경우 제거
  return value.trim().replace(/^["']|["']$/g, "");
}

/**
 * createClient 에 넣을 Project URL.
 * 경로·쿼리·해시·끝 슬래시를 제거하고 origin 만 반환한다.
 */
export function getSupabaseUrl(): string {
  const raw = readRawEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    // https://xxxx.supabase.co 만 사용 (path 절대 포함 금지)
    return parsed.origin;
  } catch {
    // URL 파싱 실패 시 슬래시만 제거해 반환
    return raw.replace(/\/+$/, "");
  }
}

/** anon public key */
export function getSupabaseAnonKey(): string {
  return readRawEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isPlaceholder(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return true;
  if (url.includes("your-project-ref.supabase.co")) return true;
  if (anonKey === "your-anon-key") return true;
  return false;
}

export function hasSupabasePublicEnv(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (isPlaceholder(url, anonKey)) return false;
  return true;
}

/**
 * supabase-js 가 실제로 치는 Auth 베이스 URL.
 * 로그인 최종 경로: `{authBaseUrl}/token?grant_type=password`
 */
export function getSupabaseAuthBaseUrl(): string {
  const origin = getSupabaseUrl();
  if (!origin) return "";
  return `${origin}/auth/v1`;
}

/** 로그인(signInWithPassword) 요청 URL (디버그·검증용) */
export function getSignInWithPasswordUrl(): string {
  const base = getSupabaseAuthBaseUrl();
  if (!base) return "";
  return `${base}/token?grant_type=password`;
}
