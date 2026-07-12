/**
 * =============================================================================
 * Manuscript Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 로그인(Supabase) 후: 읽기/쓰기는 클라우드만. LocalStorage 는 백업 쓰기만.
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
import { MANUSCRIPTS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { MANUSCRIPTS_STORAGE_KEY };

function readLocalManuscripts(): Manuscript[] {
  return readJsonArray<Manuscript>(MANUSCRIPTS_STORAGE_KEY);
}

function writeLocalManuscripts(manuscripts: Manuscript[]): void {
  writeJsonArray(MANUSCRIPTS_STORAGE_KEY, manuscripts);
}

function backupManuscripts(manuscripts: Manuscript[]): void {
  writeWorkDataBackup(MANUSCRIPTS_STORAGE_KEY, manuscripts);
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

export async function getManuscriptByChapterId(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<Manuscript | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const manuscript = await cloudGetManuscriptByDocumentId(
      projectId,
      chapterId,
    );
    return manuscript;
  }

  return (
    readLocalManuscripts().find(
      (item) => item.projectId === projectId && item.chapterId === chapterId,
    ) ?? null
  );
}

export async function saveManuscriptContent(params: {
  projectId: ProjectId;
  chapterId: ChapterId;
  content: string;
}): Promise<Manuscript> {
  const { projectId, chapterId, content } = params;
  const timestamp = nowIso();
  const plainText = content;
  const wordCount = countCharsWithoutSpaces(plainText);

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudGetManuscriptByDocumentId(
      projectId,
      chapterId,
    );

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
    try {
      backupManuscripts(await cloudListManuscripts());
    } catch {
      // 백업 실패는 본 저장 성공에 영향 없음
    }
    return saved;
  }

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
  return saved;
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
