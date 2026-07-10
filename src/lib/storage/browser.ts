/**
 * =============================================================================
 * 브라우저 저장 헬퍼
 * -----------------------------------------------------------------------------
 * 실제 읽기/쓰기는 StorageService (현재 LocalStorageService)를 통한다.
 * features 하위 *-storage.ts 는 이 헬퍼를 계속 사용한다 → 기존 기능 유지.
 * =============================================================================
 */

import { getStorageService } from "@/services/storage";

/** StorageService 사용 가능 여부 */
export function canUseStorage(): boolean {
  return getStorageService().isAvailable();
}

/** 현재 시각 ISO 8601 문자열 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * JSON 배열을 안전하게 읽는다.
 * 없거나 깨져 있으면 빈 배열.
 */
export function readJsonArray<T>(key: string): T[] {
  const storage = getStorageService();
  if (!storage.isAvailable()) return [];

  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

/** JSON 배열을 저장한다. */
export function writeJsonArray<T>(key: string, items: T[]): void {
  const storage = getStorageService();
  if (!storage.isAvailable()) return;
  storage.setItem(key, JSON.stringify(items));
}

/** 문자열 값 읽기 */
export function readStorageString(key: string): string | null {
  return getStorageService().getItem(key);
}

/** 문자열 값 쓰기 */
export function writeStorageString(key: string, value: string): void {
  getStorageService().setItem(key, value);
}
