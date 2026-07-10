/**
 * =============================================================================
 * CloudStorageService (빈 구조)
 * -----------------------------------------------------------------------------
 * Supabase DB 저장은 이번 단계에서 구현하지 않는다.
 * 로그인·동기화 단계에서 이 클래스를 채운다.
 * =============================================================================
 */

import type { StorageService } from "@/services/storage/storage.interface";

/**
 * 클라우드 저장소 스텁.
 * 메서드는 아직 동작하지 않으며, 호출 시 명확한 오류를 던진다.
 */
export class CloudStorageService implements StorageService {
  isAvailable(): boolean {
    return false;
  }

  getItem(key: string): string | null {
    throw new Error(
      `[Novel Studio] CloudStorageService.getItem("${key}") is not implemented yet. Use LocalStorage.`,
    );
  }

  setItem(key: string, value: string): void {
    throw new Error(
      `[Novel Studio] CloudStorageService.setItem("${key}", ${value.length} chars) is not implemented yet. Use LocalStorage.`,
    );
  }

  removeItem(key: string): void {
    throw new Error(
      `[Novel Studio] CloudStorageService.removeItem("${key}") is not implemented yet. Use LocalStorage.`,
    );
  }
}

/** 클라우드 저장소 인스턴스 (미구현) */
export const cloudStorageService = new CloudStorageService();
