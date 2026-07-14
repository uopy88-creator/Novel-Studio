/**
 * =============================================================================
 * Manuscript Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 로그인(Supabase) 후: 읽기/쓰기는 클라우드만. LocalStorage 는 백업만.
 *
 * 안정성 규칙:
 * - null(행 없음 / 조회 실패) 과 ""(빈 원고) 를 절대 혼동하지 않는다.
 * - 기존 원고가 있는데 content="" 로 덮어쓰지 않는다 (사용자 명시 삭제만 허용).
 * - 저장 후 재조회로 길이를 검증한다.
 * - 백업은 "저장 전 스냅샷 유지 → 저장·검증 성공 후 갱신" 순서를 지킨다.
 * =============================================================================
 */

import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { ChapterId, ManuscriptId, ProjectId } from "@/types/ids";
import { syncChapterAfterManuscriptWrite } from "@/features/manuscript/lib/chapter-storage";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudGetManuscriptByDocumentId,
  cloudListManuscripts,
  cloudUpsertManuscript,
} from "@/database/supabase/manuscripts-repo";
import { countCharsWithoutSpaces } from "@/lib/stats";
import { stripHighlights } from "@/features/manuscript/lib/highlight-marks";
import { MANUSCRIPTS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { MANUSCRIPTS_STORAGE_KEY };

export interface SaveManuscriptContentParams {
  projectId: ProjectId;
  chapterId: ChapterId;
  content: string;
  /**
   * true 일 때만 기존 비어 있지 않은 원고를 "" 로 덮어쓸 수 있다.
   * - 사용자 편집 삭제(autosave) → true
   * - Migration 으로 secondary Document 비우기 → true (검증 후에만)
   * - 그 외 내부 로직 기본값 false
   */
  allowEmptyOverwrite?: boolean;
}

/**
 * 빈 덮어쓰기 차단 여부 (순수 함수 — 회귀 테스트용).
 * existingLength=null 은 행 없음(신규 생성 허용).
 */
export function shouldBlockEmptyOverwrite(
  existingLength: number | null,
  nextLength: number,
  allowEmptyOverwrite: boolean,
): boolean {
  return (
    existingLength != null &&
    existingLength > 0 &&
    nextLength === 0 &&
    !allowEmptyOverwrite
  );
}

function readLocalManuscripts(): Manuscript[] {
  return readJsonArray<Manuscript>(MANUSCRIPTS_STORAGE_KEY);
}

function writeLocalManuscripts(manuscripts: Manuscript[]): void {
  writeJsonArray(MANUSCRIPTS_STORAGE_KEY, manuscripts);
}

function backupManuscripts(manuscripts: Manuscript[]): void {
  writeWorkDataBackup(MANUSCRIPTS_STORAGE_KEY, manuscripts);
}

/**
 * 저장 전에 현재 로컬 백업을 한 번 더 고정한다.
 * 이후 클라우드 저장이 실패해도 직전 스냅샷이 남도록 한다.
 */
function preserveLocalBackupBeforeSave(): void {
  try {
    backupManuscripts(readLocalManuscripts());
  } catch (error) {
    console.warn(
      "[manuscript-storage] pre-save backup preserve failed (continuing)",
      error,
    );
  }
}

function createManuscriptId(): ManuscriptId {
  return crypto.randomUUID();
}

export async function readAllManuscripts(): Promise<Manuscript[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const manuscripts = await cloudListManuscripts();
    backupManuscripts(manuscripts);
    return manuscripts;
  }
  return readLocalManuscripts();
}

/** @deprecated 클라우드 모드에서는 사용하지 않음 */
export async function writeAllManuscripts(
  manuscripts: Manuscript[],
): Promise<void> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    for (const manuscript of manuscripts) {
      await cloudUpsertManuscript(manuscript);
    }
    backupManuscripts(await cloudListManuscripts());
    return;
  }
  writeLocalManuscripts(manuscripts);
}

/**
 * Document 에 연결된 원고를 조회한다.
 *
 * - 반환 Manuscript: 행이 존재 (content 는 "" 일 수 있음 = 실제 빈 원고)
 * - 반환 null: 행이 없음 (아직 저장된 적 없음)
 * - throw: 네트워크/DB 조회 실패 (빈 문자열로 대체하지 않음)
 */
export async function getManuscriptByChapterId(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<Manuscript | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    // cloud repo 가 error 시 throw. maybeSingle 의 data=null 만 "행 없음".
    return cloudGetManuscriptByDocumentId(projectId, chapterId);
  }

  return (
    readLocalManuscripts().find(
      (item) => item.projectId === projectId && item.chapterId === chapterId,
    ) ?? null
  );
}

/**
 * 저장 직후 재조회하여 content 길이가 일치하는지 확인한다.
 * 불일치·행 없음은 오류로 처리한다 (빈 문자열 자동 허용 금지).
 */
async function verifyManuscriptSaved(params: {
  projectId: ProjectId;
  chapterId: ChapterId;
  expectedContent: string;
}): Promise<Manuscript> {
  const { projectId, chapterId, expectedContent } = params;
  const verified = await getManuscriptByChapterId(projectId, chapterId);

  if (verified == null) {
    throw new Error(
      `[manuscript-storage] 저장 검증 실패: 원고 행을 다시 조회할 수 없습니다 ` +
        `(project=${projectId}, document=${chapterId})`,
    );
  }

  if (verified.content.length !== expectedContent.length) {
    throw new Error(
      `[manuscript-storage] 저장 검증 실패: 길이 불일치 ` +
        `(expected=${expectedContent.length}, actual=${verified.content.length}, ` +
        `project=${projectId}, document=${chapterId})`,
    );
  }

  return verified;
}

/**
 * 원고 content 저장.
 *
 * 순서: 기존 백업 보존 → 저장 → 재조회 검증 → 백업 갱신
 */
export async function saveManuscriptContent(
  params: SaveManuscriptContentParams,
): Promise<Manuscript> {
  const {
    projectId,
    chapterId,
    content,
    allowEmptyOverwrite = false,
  } = params;
  const timestamp = nowIso();
  const plainText = stripHighlights(content);
  const wordCount = countCharsWithoutSpaces(plainText);

  // --- 안전장치: 기존 비어 있지 않은 원고 → "" 덮어쓰기 차단 ---
  const existingBefore = await getManuscriptByChapterId(projectId, chapterId);
  if (
    shouldBlockEmptyOverwrite(
      existingBefore == null ? null : existingBefore.content.length,
      content.length,
      allowEmptyOverwrite,
    )
  ) {
    console.warn(
      "[manuscript-storage] blocked empty overwrite of non-empty manuscript",
      {
        projectId,
        chapterId,
        existingLength: existingBefore!.content.length,
      },
    );
    return existingBefore!;
  }

  // 저장 실패 시를 위해 현재 로컬 백업을 먼저 고정
  preserveLocalBackupBeforeSave();

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = existingBefore;

    const saved: Manuscript = existing
      ? {
          ...existing,
          content,
          plainText,
          wordCount,
          updatedAt: timestamp,
          lastOpenedAt: timestamp,
        }
      : {
          id: createManuscriptId(),
          projectId,
          chapterId,
          content,
          plainText,
          wordCount,
          createdAt: timestamp,
          updatedAt: timestamp,
          lastOpenedAt: timestamp,
        };

    await cloudUpsertManuscript(saved);
    await syncChapterAfterManuscriptWrite(chapterId, wordCount);

    const verified = await verifyManuscriptSaved({
      projectId,
      chapterId,
      expectedContent: content,
    });

    // 검증 성공 후에만 백업 갱신
    try {
      backupManuscripts(await cloudListManuscripts());
    } catch (error) {
      console.warn(
        "[manuscript-storage] post-verify backup refresh failed",
        error,
      );
    }

    return verified;
  }

  // --- LocalStorage 모드 ---
  const local = readLocalManuscripts();
  const existing =
    local.find(
      (item) => item.projectId === projectId && item.chapterId === chapterId,
    ) ?? null;

  const saved: Manuscript = existing
    ? {
        ...existing,
        content,
        plainText,
        wordCount,
        updatedAt: timestamp,
        lastOpenedAt: timestamp,
      }
    : {
        id: createManuscriptId(),
        projectId,
        chapterId,
        content,
        plainText,
        wordCount,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastOpenedAt: timestamp,
      };

  const localIndex = local.findIndex(
    (item) => item.projectId === projectId && item.chapterId === chapterId,
  );
  if (localIndex >= 0) {
    const next = [...local];
    next[localIndex] = saved;
    writeLocalManuscripts(next);
  } else {
    writeLocalManuscripts([...local, saved]);
  }

  await syncChapterAfterManuscriptWrite(chapterId, wordCount);

  const verified = await verifyManuscriptSaved({
    projectId,
    chapterId,
    expectedContent: content,
  });

  // 로컬 모드는 write 자체가 백업이므로 추가 갱신은 생략 가능하나,
  // 검증 통과 시점을 명시적으로 남긴다.
  backupManuscripts(readLocalManuscripts());

  return verified;
}

export async function touchManuscriptOpened(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<void> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudGetManuscriptByDocumentId(
      projectId,
      chapterId,
    );
    if (!existing) return;
    const updated: Manuscript = {
      ...existing,
      lastOpenedAt: nowIso(),
    };
    await cloudUpsertManuscript(updated);
    backupManuscripts(await cloudListManuscripts());
    return;
  }

  const local = readLocalManuscripts();
  const index = local.findIndex(
    (item) => item.projectId === projectId && item.chapterId === chapterId,
  );
  if (index < 0) return;
  const next = [...local];
  next[index] = { ...local[index], lastOpenedAt: nowIso() };
  writeLocalManuscripts(next);
}
