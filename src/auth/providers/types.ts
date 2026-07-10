/**
 * =============================================================================
 * Auth Provider 계약
 * -----------------------------------------------------------------------------
 * 나중에 Supabase Auth / 기타 제공자를 같은 인터페이스로 붙인다.
 * 지금은 구현체가 “미구현”만 반환한다.
 * =============================================================================
 */

import type { AuthSession, AuthUser } from "@/auth/types";

export interface SignInWithEmailInput {
  email: string;
  password: string;
}

export interface SignUpWithEmailInput {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * 인증 제공자 인터페이스.
 * UI는 이 계약만 호출하고, 내부 구현(Supabase 등)은 교체 가능하게 둔다.
 */
export interface AuthProvider {
  readonly name: string;

  getSession(): Promise<AuthSession | null>;
  getUser(): Promise<AuthUser | null>;

  signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession>;
  signUpWithEmail(input: SignUpWithEmailInput): Promise<AuthSession>;
  signOut(): Promise<void>;
}
