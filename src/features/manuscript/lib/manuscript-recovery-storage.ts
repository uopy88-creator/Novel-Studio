/**
 * =============================================================================
 * Manuscript Recovery Storage — LocalStorage ONLY
 * -----------------------------------------------------------------------------
 * ⚠️ Supabase 와 충돌하지 않기 위한 규칙
 * 1) 읽기/쓰기 모두 브라우저 LocalStorage 만 사용
 * 2) WORK_DATA_BACKUP_KEYS 에 넣지 않음 (클라우드 백업·복원과 무관)
 * 3) manuscript-storage / manuscripts-repo 경로에서 절대 호출하지 않음
 * 4) 복원 수락 시에만 setContent → 기존 800ms 자동 저장이 클라우드에 반영
 * =============================================================================
 */

import type { ManuscriptRecoveryDraft } from "@/features/manuscript/types/manuscript-recovery";
import type { ChapterId, ProjectId } from "@/types/ids";
import { MANUSCRIPT_RECOVERY_STORAGE_KEY } from "@/lib/storage/keys";
import {
  canUseStorage,
  nowIso,
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";
import { getStorageService } from "@/services/storage";

export { MANUSCRIPT_RECOVERY_STORAGE_KEY };

type RecoveryMap = Record<string, ManuscriptRecoveryDraft>;

function draftKey(projectId: ProjectId, chapterId: ChapterId): string {
  return `${projectId}::${chapterId}`;
}

function readMap(): RecoveryMap {
  if (!canUseStorage()) return {};
  try {
    const raw = readStorageString(MANUSCRIPT_RECOVERY_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as RecoveryMap;
  } catch {
    return {};
  }
}

function writeMap(map: RecoveryMap): void {
  if (!canUseStorage()) return;
  writeStorageString(MANUSCRIPT_RECOVERY_STORAGE_KEY, JSON.stringify(map));
}

/** 복구 초안 조회 (없으면 null) */
export function getRecoveryDraft(
  projectId: ProjectId,
  chapterId: ChapterId,
): ManuscriptRecoveryDraft | null {
  const map = readMap();
  return map[draftKey(projectId, chapterId)] ?? null;
}

/**
 * 30초 주기·페이지 숨김 시 호출.
 * 내용이 비어 있고 기존 초안도 없으면 쓰지 않는다.
 */
export function writeRecoveryDraft(params: {
  projectId: ProjectId;
  chapterId: ChapterId;
  content: string;
}): ManuscriptRecoveryDraft | null {
  const { projectId, chapterId, content } = params;
  if (!canUseStorage()) return null;

  const existing = getRecoveryDraft(projectId, chapterId);
  // 동일 내용이면 타임스탬프만 갱신하지 않고 스킵 (불필요 쓰기 감소)
  if (existing && existing.content === content) {
    return existing;
  }

  const draft: ManuscriptRecoveryDraft = {
    projectId,
    chapterId,
    content,
    updatedAt: nowIso(),
  };

  const map = readMap();
  map[draftKey(projectId, chapterId)] = draft;
  writeMap(map);
  return draft;
}

/** 복원하지 않음 / 복원 완료 / 저장본과 동일해진 경우 삭제 */
export function clearRecoveryDraft(
  projectId: ProjectId,
  chapterId: ChapterId,
): void {
  if (!canUseStorage()) return;
  const map = readMap();
  const key = draftKey(projectId, chapterId);
  if (!(key in map)) return;
  delete map[key];
  if (Object.keys(map).length === 0) {
    getStorageService().removeItem(MANUSCRIPT_RECOVERY_STORAGE_KEY);
    return;
  }
  writeMap(map);
}

/** 저장본과 복구본이 실질적으로 다른지 */
export function recoveryDiffersFromSaved(
  draftContent: string,
  savedContent: string,
): boolean {
  return draftContent !== savedContent;
}
