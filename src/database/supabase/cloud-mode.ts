/**
 * =============================================================================
 * Cloud DB 사용 가능 여부
 * -----------------------------------------------------------------------------
 * 온라인 + Supabase 설정 + 로그인 세션이 있을 때만 Database를 우선 사용한다.
 * 그 외에는 LocalStorage 백업만 사용한다.
 * =============================================================================
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export async function canUseCloudDb(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }

  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user?.id) return false;
    return true;
  } catch {
    return false;
  }
}

/** 현재 로그인 사용자 id. 없으면 null. */
export async function getCloudUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user?.id) return null;
    return data.session.user.id;
  } catch {
    return null;
  }
}

export async function requireCloudUserId(): Promise<string> {
  const userId = await getCloudUserId();
  if (!userId) {
    throw new Error("로그인이 필요합니다. 다시 로그인해 주세요.");
  }
  return userId;
}
