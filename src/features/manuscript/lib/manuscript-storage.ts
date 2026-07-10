/**
 * =============================================================================
 * Manuscript LocalStorage
 * -----------------------------------------------------------------------------
 * Document(Chapter) 1 : Manuscript 1
 * Dashboard와 같은 키(novel-studio:manuscripts)를 사용해 통계가 연동된다.
 * =============================================================================
 */

import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { ChapterId, ManuscriptId, ProjectId } from "@/types/ids";
import { syncChapterAfterManuscriptWrite } from "@/features/manuscript/lib/chapter-storage";
import {
  countCharsWithoutSpaces,
} from "@/features/dashboard/lib/stats";

/** Dashboard `MANUSCRIPTS_STORAGE_KEY` 와 동일해야 한다 */
export const MANUSCRIPTS_STORAGE_KEY = "novel-studio:manuscripts";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

export function readAllManuscripts(): Manuscript[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(MANUSCRIPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Manuscript[];
  } catch {
    return [];
  }
}

export function writeAllManuscripts(manuscripts: Manuscript[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    MANUSCRIPTS_STORAGE_KEY,
    JSON.stringify(manuscripts),
  );
}

export function getManuscriptByChapterId(
  projectId: ProjectId,
  chapterId: ChapterId,
): Manuscript | null {
  return (
    readAllManuscripts().find(
      (item) => item.projectId === projectId && item.chapterId === chapterId,
    ) ?? null
  );
}

function createManuscriptId(): ManuscriptId {
  return crypto.randomUUID();
}

/**
 * 본문 저장 (없으면 생성, 있으면 갱신).
 * plainText / wordCount를 함께 갱신하고 Document 메타도 맞춘다.
 */
export function saveManuscriptContent(params: {
  projectId: ProjectId;
  chapterId: ChapterId;
  content: string;
}): Manuscript {
  const { projectId, chapterId, content } = params;
  const all = readAllManuscripts();
  const index = all.findIndex(
    (item) => item.projectId === projectId && item.chapterId === chapterId,
  );
  const timestamp = nowIso();
  const plainText = content;
  const charsWithoutSpaces = countCharsWithoutSpaces(plainText);
  // wordCount 필드: 공백 제외 글자수 (한국어 집필 지표와 맞춤)
  const wordCount = charsWithoutSpaces;

  let saved: Manuscript;

  if (index >= 0) {
    saved = {
      ...all[index],
      content,
      plainText,
      wordCount,
      updatedAt: timestamp,
      lastOpenedAt: timestamp,
    };
    const next = [...all];
    next[index] = saved;
    writeAllManuscripts(next);
  } else {
    saved = {
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
    writeAllManuscripts([...all, saved]);
  }

  syncChapterAfterManuscriptWrite(chapterId, wordCount);
  return saved;
}

/** 열람만 했을 때 lastOpenedAt 갱신 (내용 변경 없음) */
export function touchManuscriptOpened(
  projectId: ProjectId,
  chapterId: ChapterId,
): void {
  const all = readAllManuscripts();
  const index = all.findIndex(
    (item) => item.projectId === projectId && item.chapterId === chapterId,
  );
  if (index < 0) return;

  const next = [...all];
  next[index] = {
    ...all[index],
    lastOpenedAt: nowIso(),
  };
  writeAllManuscripts(next);
}
