/**
 * =============================================================================
 * Auth Service
 * -----------------------------------------------------------------------------
 * UI / 기능 코드가 직접 Provider를 고르지 않도록 한 단계 감싼다.
 * Supabase 환경변수가 있으면 Supabase Auth를 사용한다.
 * =============================================================================
 */

import { getAuthProvider } from "@/auth/get-auth-provider";
import type {
  AuthProvider,
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "@/auth/providers/types";
import type { AuthSession, AuthUser } from "@/auth/types";

export class AuthService {
  constructor(private readonly provider: AuthProvider = getAuthProvider()) {}

  getProviderName(): string {
    return this.provider.name;
  }

  getSession(): Promise<AuthSession | null> {
    return this.provider.getSession();
  }

  getUser(): Promise<AuthUser | null> {
    return this.provider.getUser();
  }

  signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession> {
    return this.provider.signInWithEmail(input);
  }

  signUpWithEmail(input: SignUpWithEmailInput): Promise<AuthSession> {
    return this.provider.signUpWithEmail(input);
  }

  signOut(): Promise<void> {
    return this.provider.signOut();
  }
}

/** 앱 전역에서 재사용할 기본 인스턴스 */
export const authService = new AuthService();
