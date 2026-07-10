/**
 * =============================================================================
 * Supabase Browser Client
 * -----------------------------------------------------------------------------
 * Next.js App Router · 브라우저용 클라이언트.
 *
 * 환경변수는 `public-env.ts` 에서만 읽는다.
 * (NEXT_PUBLIC_* 가 클라이언트 번들에 올바르게 인라인되도록)
 *
 * Auth 세션은 persistSession 으로 브라우저 localStorage에 유지된다.
 * =============================================================================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public-env";

const AUTH_STORAGE_KEY = "novel-studio:supabase-auth";

let browserClient: SupabaseClient | null = null;

/** 환경변수가 채워져 있는지 (플레이스홀더 제외) */
export function isSupabaseConfigured(): boolean {
  return hasSupabasePublicEnv();
}

/**
 * Safari 비공개 모드 등에서 localStorage 접근이 막힐 때를 위한 안전한 래퍼.
 * 세션 유지는 못 할 수 있어도, 로그인 API 호출 자체는 가능하게 한다.
 */
function createAuthStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      get length() {
        return 0;
      },
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {},
    };
  }

  try {
    const probe = "__ns_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    console.warn(
      "[Novel Studio Auth] localStorage unavailable — session will not persist (Safari private mode?)",
    );
    const memory = new Map<string, string>();
    return {
      get length() {
        return memory.size;
      },
      clear() {
        memory.clear();
      },
      getItem(key: string) {
        return memory.has(key) ? memory.get(key)! : null;
      },
      key(index: number) {
        return Array.from(memory.keys())[index] ?? null;
      },
      removeItem(key: string) {
        memory.delete(key);
      },
      setItem(key: string, value: string) {
        memory.set(key, value);
      },
    };
  }
}

/**
 * 브라우저용 Supabase 클라이언트.
 * 미설정이면 null — 작품 데이터 LocalStorage 기능은 그대로 동작한다.
 *
 * SSR에서는 싱글톤에 넣지 않는다 (localStorage 없는 클라이언트가 캐시되는 것 방지).
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (typeof window === "undefined") {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage: createAuthStorage(),
      storageKey: AUTH_STORAGE_KEY,
    },
  });

  return browserClient;
}

/** 설정된 경우에만 클라이언트를 반환 */
export function getSupabaseClient(): SupabaseClient | null {
  return createSupabaseClient();
}

/**
 * Auth 호출용 — 미설정이면 명확한 오류.
 * (작품 CRUD 등에는 쓰지 않는다.)
 */
export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. Vercel에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고 Redeploy 하세요.",
    );
  }
  return client;
}
