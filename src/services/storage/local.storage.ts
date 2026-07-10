/**
 * =============================================================================
 * LocalStorageService
 * -----------------------------------------------------------------------------
 * 기존 브라우저 LocalStorage 구현.
 * Project / Documents / Editor 등 현재 기능이 이 구현을 사용한다.
 * =============================================================================
 */

import type { StorageService } from "@/services/storage/storage.interface";

function canUseLocalStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export class LocalStorageService implements StorageService {
  isAvailable(): boolean {
    return canUseLocalStorage();
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // quota 등 — 무시 (기존 동작과 동일)
    }
  }

  removeItem(key: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/** 앱 기본 Local 저장소 인스턴스 */
export const localStorageService = new LocalStorageService();
