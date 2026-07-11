/**
 * =============================================================================
 * Auth Provider 선택
 * -----------------------------------------------------------------------------
 * Supabase 환경변수가 있으면 항상 Supabase Auth 만 사용한다.
 * (로컬 폴백은 env 가 없을 때만 — 로그인 경로에서 fetch/REST 직접 호출 없음)
 * =============================================================================
 */

import type { AuthProvider } from "@/auth/providers/types";
import { localAuthProvider } from "@/auth/providers/local-auth-provider";
import { supabaseAuthProvider } from "@/auth/providers/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function getAuthProvider(): AuthProvider {
  if (isSupabaseConfigured()) {
    return supabaseAuthProvider;
  }
  return localAuthProvider;
}
