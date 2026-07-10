/**
 * =============================================================================
 * LocalStorage Adapter
 * -----------------------------------------------------------------------------
 * 기존 browser.ts 헬퍼를 Storage Layer 계약으로 감싼다.
 * 동작은 현재와 동일하며, 기능 코드를 당장 바꾸지 않아도 된다.
 * =============================================================================
 */

import type { KeyValueStore, StorageAdapter } from "@/lib/storage/types";
import {
  canUseStorage,
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";

const localKeyValueStore: KeyValueStore = {
  isAvailable: () => canUseStorage(),

  async getItem(key) {
    return readStorageString(key);
  },

  async setItem(key, value) {
    writeStorageString(key, value);
  },

  async removeItem(key) {
    if (!canUseStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/** LocalStorage 기반 어댑터 (현재 기본) */
export const localStorageAdapter: StorageAdapter = {
  mode: "local",
  kv: localKeyValueStore,
};
