/**
 * =============================================================================
 * Auth — 도메인 타입
 * -----------------------------------------------------------------------------
 * 로그인 UI / Supabase Auth 연동 전에 쓰는 계약만 정의한다.
 * =============================================================================
 */

/** 앱에서 다루는 사용자 (Supabase user 와 1:1로 맞출 예정) */
export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
}

/** 세션 스냅샷 */
export interface AuthSession {
  user: AuthUser;
  /** ISO 만료 시각 — 없으면 알 수 없음 */
  expiresAt?: string | null;
  accessToken?: string | null;
}

/** 인증 상태 */
export type AuthStatus = "anonymous" | "authenticated" | "loading" | "error";

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  errorMessage?: string;
}
