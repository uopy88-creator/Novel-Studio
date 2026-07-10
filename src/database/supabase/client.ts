/**
 * =============================================================================
 * Supabase 클라이언트 (database 모듈 진입용)
 * -----------------------------------------------------------------------------
 * 실제 클라이언트는 `@/lib/supabase` 에 있다.
 * 환경변수 읽기는 `@/lib/supabase/public-env` 를 사용한다.
 * =============================================================================
 */

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/public-env";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabasePublicConfig {
  url: string | undefined;
  anonKey: string | undefined;
  /** 설정값이 채워져 있는지 (연결 여부와 별개) */
  isConfigured: boolean;
}

/** 환경 변수만 읽는다. 네트워크 요청 없음. */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return {
    url: url || undefined,
    anonKey: anonKey || undefined,
    isConfigured: isSupabaseConfigured(),
  };
}

/**
 * 브라우저용 Supabase 클라이언트.
 * 미설정이면 null. 구현은 `@/lib/supabase/client` 와 동일하다.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  return getSupabaseClient();
}
