/**
 * =============================================================================
 * Auth Service
 * -----------------------------------------------------------------------------
 * UI / 기능 코드가 직접 Provider를 고르지 않도록 한 단계 감싼다.
 *
 * import 시점에 Auth Provider / Supabase client 를 만들지 않는다.
 * 로그인·회원가입·세션 조회 등 메서드가 호출될 때만 getAuthProvider() 로 고른다.
 * (그 안에서 필요 시 Supabase client 를 가져온다.)
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
  /**
   * 호출 시점에만 provider를 고른다.
   * 모듈 로드·생성자에서는 호출하지 않는다.
   */
  private resolveProvider(): AuthProvider {
    return getAuthProvider();
  }

  getProviderName(): string {
    return this.resolveProvider().name;
  }

  /** provider가 준비됐는지 (이름만, 클라이언트 생성은 signIn 시) */
  hasProvider(): boolean {
    return Boolean(this.resolveProvider());
  }

  getSession(): Promise<AuthSession | null> {
    return this.resolveProvider().getSession();
  }

  getUser(): Promise<AuthUser | null> {
    return this.resolveProvider().getUser();
  }

  /** 로그인 버튼 시점에 provider → Supabase client 를 가져온다 */
  signInWithEmail(input: SignInWithEmailInput): Promise<AuthSession> {
    return this.resolveProvider().signInWithEmail(input);
  }

  signUpWithEmail(input: SignUpWithEmailInput): Promise<AuthSession> {
    return this.resolveProvider().signUpWithEmail(input);
  }

  signOut(): Promise<void> {
    return this.resolveProvider().signOut();
  }
}

/**
 * 인스턴스만 만든다. 생성자는 provider/client 를 만들지 않는다.
 */
export const authService = new AuthService();
