/**
 * =============================================================================
 * Dashboard용 데이터 읽기
 * -----------------------------------------------------------------------------
 * Dashboard는 수정하지 않는다. 읽기만 한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import { readAllManuscripts } from "@/features/manuscript/lib/manuscript-storage";
import {
  pickFeaturedCharacters,
  readCharactersByProject as readCharactersFromStorage,
} from "@/features/characters/lib/character-storage";
import {
  pickRecentInspirations,
  readInspirationsByProject,
} from "@/features/inspiration/lib/inspiration-storage";
import { readMemosByProject } from "@/features/memo/lib/memo-storage";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/lib/stats";

export {
  CHARACTERS_STORAGE_KEY,
  MANUSCRIPTS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
} from "@/lib/storage/keys";

export async function readManuscriptsByProject(
  projectId: ProjectId,
): Promise<Manuscript[]> {
  const all = await readAllManuscripts();
  return all.filter((item) => item.projectId === projectId);
}

export async function readCharactersByProject(
  projectId: ProjectId,
): Promise<Character[]> {
  return readCharactersFromStorage(projectId);
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
  featuredCharacters: Character[];
  recentInspirations: Inspiration[];
}

export async function buildDashboardSnapshot(
  projectId: ProjectId,
): Promise<DashboardSnapshot> {
  const documents = await readChaptersByProject(projectId);
  const manuscripts = await readManuscriptsByProject(projectId);
  const memos = await readMemosByProject(projectId);
  const characters = await readCharactersByProject(projectId);
  const inspirations = await readInspirationsByProject(projectId);

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
    bookPages: estimateBookPages(totalChars),
    memoCount: memos.length,
    characterCount: characters.length,
    recentDocuments: buildRecentDocuments(documents),
    featuredCharacters: pickFeaturedCharacters(characters, 4),
    recentInspirations: pickRecentInspirations(inspirations, 3),
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
