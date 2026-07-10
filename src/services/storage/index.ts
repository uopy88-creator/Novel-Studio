/**
 * =============================================================================
 * Storage 진입점
 * -----------------------------------------------------------------------------
 * 키-값 백업용 LocalStorageService.
 * 도메인 데이터(Project 등)는 features/*-storage → Supabase DB 경로를 쓴다.
 * =============================================================================
 */

export type { StorageService } from "./storage.interface";
export { LocalStorageService, localStorageService } from "./local.storage";
export { CloudStorageService, cloudStorageService } from "./cloud.storage";

import type { StorageService } from "./storage.interface";
import { localStorageService } from "./local.storage";

/** LocalStorage 백업 헬퍼용 */
export function getStorageService(): StorageService {
  return localStorageService;
}
