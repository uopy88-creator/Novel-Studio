/**
 * =============================================================================
 * Supabase Auth Provider
 * -----------------------------------------------------------------------------
 * supabase.auth 로 회원가입 · 로그인 · 로그아웃 · 세션 복원을 수행한다.
 * 작품/원고 데이터는 저장하지 않는다 (LocalStorage 유지).
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

function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. Vercel Environment Variables 또는 .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 넣고 다시 배포/재시작해 주세요.",
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

/**
 * 자동완성·모바일 키보드가 붙이는 앞뒤 공백을 제거한다.
 * (비밀번호 중간 공백은 유지)
 */
function normalizePassword(password: string): string {
  return password.trim();
}

function requirePassword(password: string): string {
  const normalized = normalizePassword(password);
  if (!normalized || normalized.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }
  return normalized;
}

/** 로그인 실패 원인 파악용 — 원본 Supabase 에러를 콘솔에 남긴다 */
function logAuthFailure(
  action: "signIn" | "signUp" | "signOut" | "getSession",
  error: AuthError | Error | unknown,
) {
  const authError = error as AuthError;
  console.error(`[Novel Studio Auth] ${action} failed`, {
    provider: "supabase",
    message: authError?.message ?? String(error),
    status: authError?.status,
    code: authError?.code,
    name: authError?.name,
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrlHost: (() => {
      try {
        const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
        return raw ? new URL(raw).host : "(missing)";
      } catch {
        return "(invalid url)";
      }
    })(),
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
      logAuthFailure("getSession", error);
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

    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      logAuthFailure("signIn", error);
      throw mapSupabaseAuthError(error);
    }

    const session = mapSupabaseSession(data.session);
    if (!session) {
      console.error("[Novel Studio Auth] signIn returned empty session", {
        provider: "supabase",
        hasUser: Boolean(data.user),
      });
      throw new Error("로그인에 실패했습니다. 다시 시도해 주세요.");
    }
    return session;
  },

  async signUpWithEmail({ email, password }) {
    const client = requireClient();
    const normalizedEmail = requireEmail(email);
    const normalizedPassword = requirePassword(password);

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      logAuthFailure("signUp", error);
      throw mapSupabaseAuthError(error);
    }

    // Confirm email 이 켜져 있으면 session 이 null 일 수 있다.
    const session = mapSupabaseSession(data.session);
    if (!session) {
      throw new Error(
        "가입은 완료되었습니다. 이메일 확인이 켜져 있으면 받은편지함의 링크를 누른 뒤 로그인해 주세요. (개발 중에는 Supabase Authentication → Providers → Email 에서 Confirm email 을 끄면 바로 로그인됩니다.)",
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
      logAuthFailure("signOut", error);
      throw mapSupabaseAuthError(error);
    }
  },
};
