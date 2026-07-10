/**
 * Auth 모듈 공개 진입점.
 * Supabase Auth(환경변수 설정 시) · LocalStorage 폴백 · React Provider.
 */

export type { AuthSession, AuthState, AuthStatus, AuthUser } from "./types";
export type {
  AuthProvider,
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "./providers/types";
export { localAuthProvider } from "./providers/local-auth-provider";
export { supabaseAuthProvider } from "./providers/supabase-auth-provider";
export { getAuthProvider } from "./get-auth-provider";
export { AuthSessionProvider, useAuth } from "./AuthProvider";
export { AuthGate } from "./AuthGate";
