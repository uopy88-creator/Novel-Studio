/**
 * =============================================================================
 * Dashboard용 데이터 읽기
 * -----------------------------------------------------------------------------
 * Dashboard는 수정하지 않는다. 읽기만 한다.
 * Documents / Manuscripts 는 Cloud 우선 저장소를 사용한다.
 * Memo / Character는 아직 LocalStorage만.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Character } from "@/features/characters/types/character";
import type { Memo } from "@/features/memo/types/memo";
import type { ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import { readAllManuscripts } from "@/features/manuscript/lib/manuscript-storage";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/lib/stats";
import {
  CHARACTERS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
} from "@/lib/storage/keys";
import { readJsonArray } from "@/lib/storage/browser";

export { CHARACTERS_STORAGE_KEY, MEMOS_STORAGE_KEY };
export { MANUSCRIPTS_STORAGE_KEY } from "@/lib/storage/keys";

export async function readManuscriptsByProject(
  projectId: ProjectId,
): Promise<Manuscript[]> {
  const all = await readAllManuscripts();
  return all.filter((item) => item.projectId === projectId);
}

export function readMemosByProject(projectId: ProjectId): Memo[] {
  return readJsonArray<Memo>(MEMOS_STORAGE_KEY).filter(
    (item) => item.projectId === projectId,
  );
}

export function readCharactersByProject(projectId: ProjectId): Character[] {
  return readJsonArray<Character>(CHARACTERS_STORAGE_KEY).filter(
    (item) => item.projectId === projectId,
  );
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  summary?: string;
  number: number;
  updatedAt: string;
}

export interface DashboardSnapshot {
  totalChars: number;
  charsWithoutSpaces: number;
  manuscriptSheets: number;
  bookPages: number;
  memoCount: number;
  characterCount: number;
  recentDocuments: RecentDocumentItem[];
}

export async function buildDashboardSnapshot(
  projectId: ProjectId,
): Promise<DashboardSnapshot> {
  const documents = await readChaptersByProject(projectId);
  const manuscripts = await readManuscriptsByProject(projectId);
  const memos = readMemosByProject(projectId);
  const characters = readCharactersByProject(projectId);

  let totalChars = 0;
  let charsWithoutSpaces = 0;

  if (manuscripts.length > 0) {
    for (const manuscript of manuscripts) {
      const text = manuscript.plainText || manuscript.content || "";
      totalChars += countCharsWithSpaces(text);
      charsWithoutSpaces += countCharsWithoutSpaces(text);
    }
  } else {
    for (const document of documents) {
      totalChars += document.wordCount;
      charsWithoutSpaces += document.wordCount;
    }
  }

  return {
    totalChars,
    charsWithoutSpaces,
    manuscriptSheets: estimateManuscriptSheets(charsWithoutSpaces),
    bookPages: estimateBookPages(charsWithoutSpaces),
    memoCount: memos.length,
    characterCount: characters.length,
    recentDocuments: buildRecentDocuments(documents),
  };
}

function buildRecentDocuments(documents: Chapter[]): RecentDocumentItem[] {
  const sortedByOrder = [...documents].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const numberById = new Map(
    sortedByOrder.map((document, index) => [document.id, index + 1]),
  );

  return [...documents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)
    .map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      number: numberById.get(document.id) ?? 0,
      updatedAt: document.updatedAt,
    }));
}
