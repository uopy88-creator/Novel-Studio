/**
 * =============================================================================
 * 작품 삭제 시 로컬/백업 데이터 정리
 * -----------------------------------------------------------------------------
 * Supabase 는 projects 행 삭제 시 FK ON DELETE CASCADE 로 클라우드 데이터가
 * 함께 지워진다. LocalStorage 백업·로컬 전용 모드·복구 초안은 여기서 지운다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import {
  CHAPTERS_STORAGE_KEY,
  CHARACTERS_STORAGE_KEY,
  DIALOGUES_STORAGE_KEY,
  FORESHADOWINGS_STORAGE_KEY,
  INSPIRATIONS_STORAGE_KEY,
  MANUSCRIPTS_STORAGE_KEY,
  MANUSCRIPT_RECOVERY_STORAGE_KEY,
  MANUSCRIPT_VERSIONS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
  SCENE_METAS_STORAGE_KEY,
  SEARCH_RECENT_STORAGE_KEY,
  TIMELINE_EVENTS_STORAGE_KEY,
  WORD_TREASURY_STORAGE_KEY,
} from "@/lib/storage/keys";
import {
  canUseStorage,
  readJsonArray,
  readStorageString,
  writeJsonArray,
  writeStorageString,
} from "@/lib/storage/browser";
import { getStorageService } from "@/services/storage";

/** projectId 필드를 가진 배열 키 */
const PROJECT_SCOPED_ARRAY_KEYS = [
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
  TIMELINE_EVENTS_STORAGE_KEY,
] as const;

function removeFromProjectScopedArray(key: string, projectId: ProjectId): void {
  const items = readJsonArray<{ projectId?: string }>(key);
  const next = items.filter((item) => item.projectId !== projectId);
  if (next.length !== items.length) {
    writeJsonArray(key, next);
  }
}

function clearRecoveryDraftsForProject(projectId: ProjectId): void {
  if (!canUseStorage()) return;
  try {
    const raw = readStorageString(MANUSCRIPT_RECOVERY_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return;
    }
    const map = { ...(parsed as Record<string, unknown>) };
    const prefix = `${projectId}::`;
    let changed = false;
    for (const key of Object.keys(map)) {
      if (key.startsWith(prefix)) {
        delete map[key];
        changed = true;
      }
    }
    if (!changed) return;
    if (Object.keys(map).length === 0) {
      getStorageService().removeItem(MANUSCRIPT_RECOVERY_STORAGE_KEY);
      return;
    }
    writeStorageString(MANUSCRIPT_RECOVERY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 복구 초안 정리는 best-effort
  }
}

function clearRecentSearchesForProject(projectId: ProjectId): void {
  const buckets = readJsonArray<{ projectId?: string }>(SEARCH_RECENT_STORAGE_KEY);
  const next = buckets.filter((bucket) => bucket.projectId !== projectId);
  if (next.length !== buckets.length) {
    writeJsonArray(SEARCH_RECENT_STORAGE_KEY, next);
  }
}

/**
 * 작품에 속한 로컬/백업 데이터를 모두 제거한다.
 * (Chapters, Manuscript, Characters, Writing Vault, Memo, Foreshadowing 등)
 */
export function purgeLocalProjectData(projectId: ProjectId): void {
  if (!canUseStorage()) return;

  for (const key of PROJECT_SCOPED_ARRAY_KEYS) {
    removeFromProjectScopedArray(key, projectId);
  }
  clearRecoveryDraftsForProject(projectId);
  clearRecentSearchesForProject(projectId);
}
