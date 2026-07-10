/**
 * =============================================================================
 * Supabase 공개 환경변수 (클라이언트 전달용)
 * -----------------------------------------------------------------------------
 * Next.js는 `process.env.NEXT_PUBLIC_*` 를 **빌드 시** 문자열로 치환한다.
 *
 * 주의: `process.env.NEXT_PUBLIC_X?.trim()` 처럼 optional chaining을 붙이면
 * Turbopack/Webpack이 치환에 실패해 브라우저에서 undefined가 될 수 있다.
 * 반드시 `process.env.NEXT_PUBLIC_X` 형태를 그대로 쓴다.
 * =============================================================================
 */

function readPublicEnv(value: string | undefined): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Project URL — Vercel / .env.local 의 NEXT_PUBLIC_SUPABASE_URL */
export function getSupabaseUrl(): string {
  return readPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** anon public key — Vercel / .env.local 의 NEXT_PUBLIC_SUPABASE_ANON_KEY */
export function getSupabaseAnonKey(): string {
  return readPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** 플레이스홀더(.env.local.example) 값이면 미설정으로 본다 */
function isPlaceholder(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return true;
  if (url.includes("your-project-ref.supabase.co")) return true;
  if (anonKey === "your-anon-key") return true;
  return false;
}

/** 클라이언트·서버 공통: Supabase 공개 env가 실제 값으로 채워졌는지 */
export function hasSupabasePublicEnv(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (isPlaceholder(url, anonKey)) return false;
  return true;
}
