"use client";

/**
 * =============================================================================
 * AuthSessionProvider (React)
 * -----------------------------------------------------------------------------
 * Supabase Auth 세션을 복원하고 onAuthStateChange 로 유지한다.
 * 작품 데이터는 LocalStorage — 이 Provider는 인증만 담당한다.
 * =============================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, AuthUser } from "@/auth/types";
import type {
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "@/auth/providers/types";
import { mapSupabaseSession } from "@/auth/lib/map-supabase-session";
import { authService } from "@/services/auth-service";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

interface AuthContextValue {
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  session: AuthSession | null;
  isSupabaseReady: boolean;
  signIn: (input: SignInWithEmailInput) => Promise<void>;
  signUp: (input: SignUpWithEmailInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "anonymous">(
    "loading",
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const isSupabaseReady = isSupabaseConfigured();

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const next = await authService.getSession();
        if (cancelled) return;
        setSession(next);
        setStatus(next ? "authenticated" : "anonymous");
      } catch {
        if (cancelled) return;
        setSession(null);
        setStatus("anonymous");
      }
    }

    void restore();

    // Supabase 세션 변경(로그인/로그아웃/토큰 갱신) 구독 → 자동 로그인 유지
    const client = getSupabaseClient();
    if (!client) {
      return () => {
        cancelled = true;
      };
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      const mapped = mapSupabaseSession(nextSession);
      setSession(mapped);
      setStatus(mapped ? "authenticated" : "anonymous");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (input: SignInWithEmailInput) => {
    const next = await authService.signInWithEmail(input);
    setSession(next);
    setStatus("authenticated");
  }, []);

  const signUp = useCallback(async (input: SignUpWithEmailInput) => {
    const next = await authService.signUpWithEmail(input);
    setSession(next);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      isSupabaseReady,
      signIn,
      signUp,
      signOut,
    }),
    [status, session, isSupabaseReady, signIn, signUp, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthSessionProvider");
  }
  return ctx;
}
