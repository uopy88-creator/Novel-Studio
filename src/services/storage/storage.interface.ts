/**
 * =============================================================================
 * StorageService — 저장소 계약
 * -----------------------------------------------------------------------------
 * 기능 코드는 LocalStorage / Supabase를 직접 부르지 않고
 * 이 인터페이스만 사용한다.
 *
 * 현재: LocalStorageService 구현
 * 이후: CloudStorageService 로 교체·병행 가능
 * =============================================================================
 */

export interface StorageService {
  /** 브라우저 LocalStorage 등 사용 가능 여부 */
  isAvailable(): boolean;

  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
