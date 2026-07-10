/**
 * =============================================================================
 * Dashboard용 LocalStorage 읽기
 * -----------------------------------------------------------------------------
 * Dashboard는 수정하지 않는다. 읽기만 한다.
 *
 * Manuscript / Memo / Character CRUD는 아직 없을 수 있다.
 * 키가 없거나 깨져 있으면 빈 배열로 취급해 통계를 0으로 보여 준다.
 * 이후 각 기능이 같은 키로 저장하면 Dashboard가 자동으로 숫자를 반영한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Character } from "@/features/characters/types/character";
import type { Memo } from "@/features/memo/types/memo";
import type { ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/features/dashboard/lib/stats";

export const MANUSCRIPTS_STORAGE_KEY = "novel-studio:manuscripts";
export const MEMOS_STORAGE_KEY = "novel-studio:memos";
export const CHARACTERS_STORAGE_KEY = "novel-studio:characters";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readJsonArray<T>(key: string): T[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

export function readManuscriptsByProject(projectId: ProjectId): Manuscript[] {
  return readJsonArray<Manuscript>(MANUSCRIPTS_STORAGE_KEY).filter(
    (item) => item.projectId === projectId,
  );
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

/** 최근 수정 Document 목록에 쓰는 요약 */
export interface RecentDocumentItem {
  id: string;
  title: string;
  summary?: string;
  /** 목록 번호 (1화…) */
  number: number;
  updatedAt: string;
}

/** Dashboard 한 화면에 필요한 집계 결과 */
export interface DashboardSnapshot {
  totalChars: number;
  charsWithoutSpaces: number;
  manuscriptSheets: number;
  bookPages: number;
  memoCount: number;
  characterCount: number;
  recentDocuments: RecentDocumentItem[];
}

/**
 * 작품 단위 Dashboard 스냅샷.
 *
 * 글자 수 우선순위
 * 1) Manuscript.plainText (또는 content) 합산
 * 2) Manuscript가 없으면 Chapter.wordCount 합산
 *    (wordCount는 “단어” 캐시이지만, 원고 기능 전에는 0인 경우가 많다)
 */
export function buildDashboardSnapshot(projectId: ProjectId): DashboardSnapshot {
  const documents = readChaptersByProject(projectId);
  const manuscripts = readManuscriptsByProject(projectId);
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
    // 원고 본문이 아직 없을 때: Document(Chapter)에 캐시된 분량이 있으면 참고
    for (const document of documents) {
      totalChars += document.wordCount;
      charsWithoutSpaces += document.wordCount;
    }
  }

  const recentDocuments = buildRecentDocuments(documents);

  return {
    totalChars,
    charsWithoutSpaces,
    manuscriptSheets: estimateManuscriptSheets(charsWithoutSpaces),
    bookPages: estimateBookPages(charsWithoutSpaces),
    memoCount: memos.length,
    characterCount: characters.length,
    recentDocuments,
  };
}

/** updatedAt 기준 최근 Document (최대 5개) */
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
