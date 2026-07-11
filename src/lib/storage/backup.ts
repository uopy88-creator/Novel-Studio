/**
 * =============================================================================
 * LocalStorage 백업 / 복원 헬퍼
 * -----------------------------------------------------------------------------
 * 작품 데이터의 주 저장소는 Supabase Database 입니다.
 *
 * LocalStorage 사용 허용 범위:
 * 1) 클라우드 읽기/쓰기 성공 직후 — 백업 스냅샷 쓰기 (writeWorkDataBackup)
 * 2) 설정 화면의 백업 내보내기 / 복원 (export / import)
 *
 * 로그인 후 CRUD 경로에서는 LocalStorage 를 읽지 않습니다.
 * =============================================================================
 */

import {
  CHAPTERS_STORAGE_KEY,
  CHARACTERS_STORAGE_KEY,
  DIALOGUES_STORAGE_KEY,
  FORESHADOWINGS_STORAGE_KEY,
  INSPIRATIONS_STORAGE_KEY,
  MANUSCRIPTS_STORAGE_KEY,
  MANUSCRIPT_VERSIONS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  SCENE_METAS_STORAGE_KEY,
  WORD_TREASURY_STORAGE_KEY,
} from "@/lib/storage/keys";
import {
  readStorageString,
  writeJsonArray,
  writeStorageString,
} from "@/lib/storage/browser";

/** 작품 데이터 백업에 쓰는 LocalStorage 키 목록 */
export const WORK_DATA_BACKUP_KEYS = [
  PROJECTS_STORAGE_KEY,
  CHAPTERS_STORAGE_KEY,
  MANUSCRIPTS_STORAGE_KEY,
  MANUSCRIPT_VERSIONS_STORAGE_KEY,
  DIALOGUES_STORAGE_KEY,
  CHARACTERS_STORAGE_KEY,
  INSPIRATIONS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
  WORD_TREASURY_STORAGE_KEY,
  FORESHADOWINGS_STORAGE_KEY,
  SCENE_METAS_STORAGE_KEY,
] as const;

export type WorkDataBackupSnapshot = Record<string, string | null>;

/**
 * 클라우드 성공 후 백업 스냅샷만 기록한다.
 * CRUD 결과로 이 값을 읽지 말 것.
 */
export function writeWorkDataBackup<T>(key: string, items: T[]): void {
  writeJsonArray(key, items);
}

/** 현재 브라우저에 있는 작품 데이터 백업을 한 객체로 모은다 */
export function exportWorkDataBackup(): WorkDataBackupSnapshot {
  const snapshot: WorkDataBackupSnapshot = {};
  for (const key of WORK_DATA_BACKUP_KEYS) {
    snapshot[key] = readStorageString(key);
  }
  return snapshot;
}

/** 백업 스냅샷을 LocalStorage 에 다시 넣는다 (명시적 복원 전용) */
export function importWorkDataBackup(snapshot: WorkDataBackupSnapshot): void {
  for (const key of WORK_DATA_BACKUP_KEYS) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      const value = snapshot[key];
      if (value === null || value === undefined) continue;
      writeStorageString(key, value);
    }
  }
}
