/**
 * =============================================================================
 * Storage 모듈 진입점
 * -----------------------------------------------------------------------------
 * 실제 읽기/쓰기는 `browser.ts` → `services/storage`(LocalStorage) 경로를 쓴다.
 * adapters / getStorageAdapter 는 다음 단계(DB)용 교체 지점으로 유지한다.
 * =============================================================================
 */

export {
  PROJECTS_STORAGE_KEY,
  CHAPTERS_STORAGE_KEY,
  MANUSCRIPTS_STORAGE_KEY,
  DIALOGUES_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
  CHARACTERS_STORAGE_KEY,
  INSPIRATIONS_STORAGE_KEY,
  WORD_TREASURY_STORAGE_KEY,
  FORESHADOWINGS_STORAGE_KEY,
  SCENE_METAS_STORAGE_KEY,
  SCENE_DELIMITER_SETTINGS_KEY,
  SIDEBAR_COLLAPSED_KEY,
  AUTH_USERS_KEY,
  AUTH_SESSION_KEY,
} from "./keys";

export {
  canUseStorage,
  nowIso,
  readJsonArray,
  writeJsonArray,
  readStorageString,
  writeStorageString,
} from "./browser";

export type {
  StorageMode,
  KeyValueStore,
  EntityCollectionStore,
  StorageAdapter,
} from "./types";

import type { StorageAdapter, StorageMode } from "@/lib/storage/types";
import { localStorageAdapter } from "@/lib/storage/adapters/local-storage-adapter";
import { supabaseStorageAdapter } from "@/lib/storage/adapters/supabase-adapter";

function readStorageMode(): StorageMode {
  const raw = process.env.NEXT_PUBLIC_STORAGE_MODE;
  return raw === "cloud" ? "cloud" : "local";
}

/**
 * 다음 단계용 어댑터 선택기.
 * 현재 기능 코드는 호출하지 않으며, browser.ts → LocalStorage 를 사용한다.
 */
export function getStorageAdapter(): StorageAdapter {
  const mode = readStorageMode();

  if (mode === "cloud") {
    if (!supabaseStorageAdapter.kv.isAvailable()) {
      return localStorageAdapter;
    }
    return supabaseStorageAdapter;
  }

  return localStorageAdapter;
}

export function getStorageMode(): StorageMode {
  return getStorageAdapter().mode;
}
