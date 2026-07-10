/**
 * =============================================================================
 * Storage Layer — 공통 계약
 * -----------------------------------------------------------------------------
 * 기능 코드(Project, Document, Manuscript …)는 이 인터페이스만 바라보게 한다.
 * 구현체만 바꾸면 LocalStorage ↔ Supabase 교체가 쉬워진다.
 *
 * 현재
 * - 실제 CRUD는 기존 features 하위 *-storage.ts 와 browser.ts 가 담당
 * - 이 레이어는 “앞으로의 교체 지점”을 미리 고정한다
 *
 * 이후
 * - LocalStorageAdapter / SupabaseAdapter 중 하나를 STORAGE_MODE 로 선택
 * =============================================================================
 */

/** 앱이 지원하는 저장 모드 */
export type StorageMode = "local" | "cloud";

/**
 * 키-값 기반 저장소 계약.
 * LocalStorage와 동일한 단순한 표면을 유지해 마이그레이션 비용을 줄인다.
 */
export interface KeyValueStore {
  /** 사용 가능 여부 (SSR / 미설정 등) */
  isAvailable(): boolean;

  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * JSON 배열 엔티티용 저장소 계약.
 * Project[] / Chapter[] 처럼 배열로 다루는 도메인에 맞춘다.
 */
export interface EntityCollectionStore<T> {
  list(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;
}

/**
 * 저장소 어댑터 묶음.
 * 도메인별 컬렉션을 나중에 여기에 붙인다.
 */
export interface StorageAdapter {
  readonly mode: StorageMode;
  readonly kv: KeyValueStore;
}
