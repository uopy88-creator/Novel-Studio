/**
 * =============================================================================
 * Auth Provider 선택
 * -----------------------------------------------------------------------------
 * React Provider / auth-service 와 순환 참조가 나지 않도록 분리한다.
 * =============================================================================
 */

import type { AuthProvider } from "@/auth/providers/types";
import { localAuthProvider } from "@/auth/providers/local-auth-provider";
import { supabaseAuthProvider } from "@/auth/providers/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Supabase 환경변수가 있으면 Supabase Auth, 없으면 로컬 폴백.
 * 작품 데이터 저장과는 무관 — 항상 LocalStorage.
 */
export function getAuthProvider(): AuthProvider {
  if (isSupabaseConfigured()) {
    return supabaseAuthProvider;
  }
  return localAuthProvider;
}
