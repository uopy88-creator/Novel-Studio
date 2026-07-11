/**
 * =============================================================================
 * Cloud DB 모드
 * -----------------------------------------------------------------------------
 * Supabase 환경변수가 있으면 작품 데이터는 항상 Database 가 단일 소스입니다.
 * LocalStorage 는 백업/복원 전용이며, 로그인 후 CRUD 경로에서 읽지 않습니다.
 * =============================================================================
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Supabase 가 설정된 환경인가?
 * true 이면 작품 데이터 CRUD 는 반드시 클라우드만 사용한다.
 */
export function isSupabaseDataMode(): boolean {
  return isSupabaseConfigured();
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

/**
 * 클라우드 CRUD 진입점.
 * - Supabase 미설정 / 오프라인 / 미로그인 시 예외 (LocalStorage 폴백 금지)
 */
export async function requireCloudDb(): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error(
      "오프라인입니다. 네트워크 연결 후 다시 시도해 주세요.",
    );
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.");
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw new Error(error.message || "세션을 확인할 수 없습니다.");
    }
    const userId = data.session?.user?.id;
    if (!userId) {
      throw new Error("로그인이 필요합니다. 다시 로그인해 주세요.");
    }
    return userId;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("클라우드 연결에 실패했습니다.");
  }
}

/**
 * 클라우드 사용 가능 여부 (호환용).
 * 저장소 모듈은 isSupabaseDataMode + requireCloudDb 를 사용하세요.
 */
export async function canUseCloudDb(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    await requireCloudDb();
    return true;
  } catch {
    return false;
  }
}
