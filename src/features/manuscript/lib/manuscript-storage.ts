/**
 * =============================================================================
 * Manuscript Storage (Cloud 우선 + LocalStorage 백업)
 * -----------------------------------------------------------------------------
 * 온라인 시 Supabase `manuscripts` 테이블. LocalStorage는 백업.
 * =============================================================================
 */

import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { ChapterId, ManuscriptId, ProjectId } from "@/types/ids";
import { syncChapterAfterManuscriptWrite } from "@/features/manuscript/lib/chapter-storage";
import { canUseCloudDb } from "@/database/supabase/cloud-mode";
import {
  cloudGetManuscriptByDocumentId,
  cloudListManuscripts,
  cloudUpsertManuscript,
} from "@/database/supabase/manuscripts-repo";
import { countCharsWithoutSpaces } from "@/lib/stats";
import { MANUSCRIPTS_STORAGE_KEY } from "@/lib/storage/keys";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { MANUSCRIPTS_STORAGE_KEY };

function readLocalManuscripts(): Manuscript[] {
  return readJsonArray<Manuscript>(MANUSCRIPTS_STORAGE_KEY);
}

function writeLocalManuscripts(manuscripts: Manuscript[]): void {
  writeJsonArray(MANUSCRIPTS_STORAGE_KEY, manuscripts);
}

function createManuscriptId(): ManuscriptId {
  return crypto.randomUUID();
}

export async function readAllManuscripts(): Promise<Manuscript[]> {
  if (await canUseCloudDb()) {
    try {
      const manuscripts = await cloudListManuscripts();
      writeLocalManuscripts(manuscripts);
      return manuscripts;
    } catch {
      return readLocalManuscripts();
    }
  }
  return readLocalManuscripts();
}

export async function writeAllManuscripts(
  manuscripts: Manuscript[],
): Promise<void> {
  writeLocalManuscripts(manuscripts);
}

export async function getManuscriptByChapterId(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<Manuscript | null> {
  if (await canUseCloudDb()) {
    try {
      const manuscript = await cloudGetManuscriptByDocumentId(
        projectId,
        chapterId,
      );
      if (manuscript) {
        const all = readLocalManuscripts();
        const index = all.findIndex(
          (item) =>
            item.projectId === projectId && item.chapterId === chapterId,
        );
        if (index >= 0) {
          const next = [...all];
          next[index] = manuscript;
          writeLocalManuscripts(next);
        } else {
          writeLocalManuscripts([...all, manuscript]);
        }
      }
      return manuscript;
    } catch {
      // fall through
    }
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
  const existing = await getManuscriptByChapterId(projectId, chapterId);
  const timestamp = nowIso();
  const plainText = content;
  const wordCount = countCharsWithoutSpaces(plainText);

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

  // 로컬 백업 먼저
  const local = readLocalManuscripts();
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

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertManuscript(saved);
    } catch {
      // 로컬 백업 유지
    }
  }

  await syncChapterAfterManuscriptWrite(chapterId, wordCount);
  return saved;
}

export async function touchManuscriptOpened(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<void> {
  const existing = await getManuscriptByChapterId(projectId, chapterId);
  if (!existing) return;

  const updated: Manuscript = {
    ...existing,
    lastOpenedAt: nowIso(),
  };

  const local = readLocalManuscripts();
  const index = local.findIndex(
    (item) => item.projectId === projectId && item.chapterId === chapterId,
  );
  if (index >= 0) {
    const next = [...local];
    next[index] = updated;
    writeLocalManuscripts(next);
  }

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertManuscript(updated);
    } catch {
      // ignore
    }
  }
}
