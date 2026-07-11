/**
 * =============================================================================
 * Supabase Auth Provider
 * -----------------------------------------------------------------------------
 * 로그인: supabase.auth.signInWithPassword() 만 사용.
 * fetch / axios / /auth/v1 / /rest/v1 직접 호출 없음.
 * =============================================================================
 */

import type { AuthError } from "@supabase/supabase-js";
import type { AuthProvider } from "@/auth/providers/types";
import { mapSupabaseAuthError } from "@/auth/lib/map-supabase-auth-error";
import { mapSupabaseSession } from "@/auth/lib/map-supabase-session";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  getSignInWithPasswordUrl,
  getSupabaseAuthBaseUrl,
  getSupabaseUrl,
} from "@/lib/supabase/public-env";

function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. Vercel에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고 Redeploy 하세요.",
    );
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase 클라이언트를 만들 수 없습니다. 환경변수를 확인해 주세요.",
    );
  }

  return client;
}

function requireEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("올바른 이메일을 입력해 주세요.");
  }
  return trimmed.toLowerCase();
}

function requirePassword(password: string): string {
  const normalized = password.trim();
  if (!normalized || normalized.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }
  return normalized;
}

function emailRedirectTo(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/`;
}

function logSupabaseAuthError(
  action: "signInWithPassword" | "signUp" | "signOut" | "getSession",
  error: AuthError,
) {
  console.log(`[Novel Studio Auth] ${action} error.message:`, error.message);
  console.log(`[Novel Studio Auth] ${action} error.code:`, error.code);
  console.log(`[Novel Studio Auth] ${action} error.status:`, error.status);
  console.error(`[Novel Studio Auth] ${action} failed`, {
    provider: "supabase",
    message: error.message,
    status: error.status,
    code: error.code,
    supabaseUrl: getSupabaseUrl(),
    authBaseUrl: getSupabaseAuthBaseUrl(),
    signInWithPasswordUrl: getSignInWithPasswordUrl(),
  });
}

export const supabaseAuthProvider: AuthProvider = {
  name: "supabase",

  async getSession() {
    if (!isSupabaseConfigured()) return null;

    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client.auth.getSession();
    if (error) {
      logSupabaseAuthError("getSession", error);
      throw mapSupabaseAuthError(error);
    }
    return mapSupabaseSession(data.session);
  },

  async getUser() {
    const session = await this.getSession();
    return session?.user ?? null;
  },

  async signInWithEmail({ email, password }) {
    const client = requireClient();
    const normalizedEmail = requireEmail(email);
    const normalizedPassword = requirePassword(password);

    // 실제 요청 URL 확인 (supabase-js 가 내부적으로 이 경로로 POST)
    const requestUrl = getSignInWithPasswordUrl();
    console.log("[Novel Studio Auth] signInWithPassword request URL:", requestUrl);
    console.log("[Novel Studio Auth] supabaseUrl (origin only):", getSupabaseUrl());

    // ★ 로그인: supabase.auth.signInWithPassword 만 사용
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      logSupabaseAuthError("signInWithPassword", error);
      throw mapSupabaseAuthError(error);
    }

    const session = mapSupabaseSession(data.session);
    if (!session) {
      console.log(
        "[Novel Studio Auth] signInWithPassword: session is null after success",
        { hasUser: Boolean(data.user) },
      );
      throw new Error("로그인에 실패했습니다. 다시 시도해 주세요.");
    }
    return session;
  },

  async signUpWithEmail({ email, password }) {
    const client = requireClient();
    const normalizedEmail = requireEmail(email);
    const normalizedPassword = requirePassword(password);

    console.log("[Novel Studio Auth] signUp auth base URL:", getSupabaseAuthBaseUrl());

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        emailRedirectTo: emailRedirectTo(),
      },
    });

    if (error) {
      logSupabaseAuthError("signUp", error);
      throw mapSupabaseAuthError(error);
    }

    const user = data.user;
    const identities = user?.identities ?? [];

    if (user && identities.length === 0) {
      throw new Error(
        "이미 가입된 이메일입니다. 로그인해 주세요. 이메일 인증이 켜져 있으면 받은편지함의 확인 링크를 먼저 눌러 주세요.",
      );
    }

    const session = mapSupabaseSession(data.session);
    if (!session) {
      throw new Error(
        "가입은 완료되었습니다. Supabase에서 이메일 인증(Confirm email)이 켜져 있으면, 받은편지함의 확인 링크를 누른 뒤 로그인해 주세요. 개발 중에는 Authentication → Providers → Email 에서 Confirm email 을 끄면 바로 로그인됩니다.",
      );
    }

    return session;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.auth.signOut();
    if (error) {
      logSupabaseAuthError("signOut", error);
      throw mapSupabaseAuthError(error);
    }
  },
};
