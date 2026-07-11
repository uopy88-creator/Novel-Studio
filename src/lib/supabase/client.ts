/**
 * =============================================================================
 * Supabase Browser Client
 * -----------------------------------------------------------------------------
 * Auth / DB 모두 @supabase/supabase-js 의 createClient 만 사용한다.
 * fetch·axios·/auth/v1·/rest/v1 직접 호출 금지.
 * =============================================================================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  getSignInWithPasswordUrl,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public-env";

const AUTH_STORAGE_KEY = "novel-studio:supabase-auth";

let browserClient: SupabaseClient | null = null;
/** 싱글톤이 잘못된 URL로 캐시되지 않도록 생성 시 URL을 기억한다 */
let browserClientUrl: string | null = null;

export function isSupabaseConfigured(): boolean {
  return hasSupabasePublicEnv();
}

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
      "[Novel Studio Auth] localStorage unavailable — session will not persist",
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
 * URL은 origin 만 사용한다 (public-env 에서 정규화).
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  if (typeof window === "undefined") {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  // URL이 바뀌었으면 싱글톤 폐기 (잘못된 path 캐시 방지)
  if (browserClient && browserClientUrl !== url) {
    browserClient = null;
    browserClientUrl = null;
  }

  if (browserClient) {
    return browserClient;
  }

  console.log("[Novel Studio Auth] createClient", {
    supabaseUrl: url,
    signInWithPasswordUrl: getSignInWithPasswordUrl(),
    anonKeyLength: anonKey.length,
  });

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // password 로그인은 PKCE 불필요 — 기본 flow 사용
      storage: createAuthStorage(),
      storageKey: AUTH_STORAGE_KEY,
    },
  });
  browserClientUrl = url;

  return browserClient;
}

export function getSupabaseClient(): SupabaseClient | null {
  return createSupabaseClient();
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. Vercel에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고 Redeploy 하세요.",
    );
  }
  return client;
}
