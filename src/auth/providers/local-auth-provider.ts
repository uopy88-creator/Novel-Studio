/**
 * =============================================================================
 * Local Auth Provider
 * -----------------------------------------------------------------------------
 * 이메일·비밀번호 계정을 LocalStorage에 두고 세션을 유지한다.
 * 닉네임·프로필·SNS는 없다. Supabase Auth는 다음 단계에서 연결한다.
 * =============================================================================
 */

import type { AuthProvider } from "@/auth/providers/types";
import {
  clearAuthSession,
  createAuthUser,
  findAuthUserByEmail,
  readAuthSession,
  toAuthUser,
  writeAuthSession,
} from "@/auth/lib/local-auth-storage";
import { hashPassword, verifyPassword } from "@/auth/lib/password";

function requirePassword(password: string): void {
  if (!password?.trim() || password.trim().length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }
}

function requireEmail(email: string): void {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("올바른 이메일을 입력해 주세요.");
  }
}

export const localAuthProvider: AuthProvider = {
  name: "local",

  async getSession() {
    return readAuthSession();
  },

  async getUser() {
    return readAuthSession()?.user ?? null;
  },

  async signInWithEmail({ email, password }) {
    requireEmail(email);
    requirePassword(password);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const record = findAuthUserByEmail(normalizedEmail);
    if (!record) {
      console.error("[Novel Studio Auth] signIn failed", {
        provider: "local",
        reason: "user_not_found",
        hint: "이 기기 LocalStorage에 계정이 없습니다. Vercel에서는 Supabase Auth를 쓰는지 확인하세요.",
      });
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const ok = await verifyPassword(
      record.email,
      normalizedPassword,
      record.passwordHash,
    );
    if (!ok) {
      console.error("[Novel Studio Auth] signIn failed", {
        provider: "local",
        reason: "bad_password",
      });
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    return writeAuthSession(toAuthUser(record));
  },

  async signUpWithEmail({ email, password }) {
    requireEmail(email);
    requirePassword(password);

    const passwordHash = await hashPassword(email.trim().toLowerCase(), password);
    const record = createAuthUser({ email, passwordHash });
    // 회원가입 성공 후 자동 로그인
    return writeAuthSession(toAuthUser(record));
  },

  async signOut() {
    clearAuthSession();
  },
};
