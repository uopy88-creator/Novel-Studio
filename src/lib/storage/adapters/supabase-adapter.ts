/**
 * =============================================================================
 * Supabase Adapter (스텁)
 * -----------------------------------------------------------------------------
 * 실제 네트워크 호출은 하지 않는다.
 * 클라우드 동기화 구현 단계에서 database/supabase 클라이언트와 연결한다.
 * =============================================================================
 */

import type { KeyValueStore, StorageAdapter } from "@/lib/storage/types";

const notReady = () =>
  new Error(
    "[Novel Studio] Supabase storage is not connected yet. Keep STORAGE_MODE=local.",
  );

const supabaseKeyValueStore: KeyValueStore = {
  isAvailable: () => false,

  async getItem() {
    throw notReady();
  },

  async setItem() {
    throw notReady();
  },

  async removeItem() {
    throw notReady();
  },
};

/** Supabase 기반 어댑터 — 구조만 준비, 미연결 */
export const supabaseStorageAdapter: StorageAdapter = {
  mode: "cloud",
  kv: supabaseKeyValueStore,
};
