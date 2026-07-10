/**
 * =============================================================================
 * Supabase 클라이언트 (database 모듈 진입용)
 * -----------------------------------------------------------------------------
 * 실제 클라이언트는 `@/lib/supabase` 에 있다.
 * 이 파일은 예전 경로 호환·다음 단계(DB) 연결을 위해 유지한다.
 * =============================================================================
 */

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabasePublicConfig {
  url: string | undefined;
  anonKey: string | undefined;
  /** 설정값이 채워져 있는지 (연결 여부와 별개) */
  isConfigured: boolean;
}

/** 환경 변수만 읽는다. 네트워크 요청 없음. */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
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
