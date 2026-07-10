/**
 * =============================================================================
 * Chapter / Document LocalStorage
 * -----------------------------------------------------------------------------
 * Document(목차) 목록 저장소.
 * 키: novel-studio:chapters (기존 호환)
 * =============================================================================
 */

import type {
  Chapter,
  DocumentKind,
} from "@/features/manuscript/types/chapter";
import {
  DEFAULT_DOCUMENT_TITLE,
  DOCUMENT_KIND_OPTIONS,
} from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";

export const CHAPTERS_STORAGE_KEY = "novel-studio:chapters";

/**
 * 생성/수정 폼 입력값.
 */
export interface ChapterInput {
  /** 문서 제목 (비어 있으면 기본값 "새 문서") */
  title: string;
  /** 문서 종류 */
  kind: DocumentKind;
  /** 간단한 설명 → summary (선택) */
  description?: string;
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function isDocumentKind(value: unknown): value is DocumentKind {
  return (
    typeof value === "string" &&
    (DOCUMENT_KIND_OPTIONS as string[]).includes(value)
  );
}

/**
 * LocalStorage 원시 객체를 Chapter로 정규화.
 * kind가 없는 구데이터는 novel(소설)로 채운다.
 */
function normalizeChapter(raw: unknown): Chapter | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Chapter>;
  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }
  if (typeof item.title !== "string") return null;

  return {
    id: item.id,
    projectId: item.projectId,
    title: item.title || DEFAULT_DOCUMENT_TITLE,
    kind: isDocumentKind(item.kind) ? item.kind : "novel",
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
    status: item.status ?? "planned",
    summary: item.summary,
    wordCount: typeof item.wordCount === "number" ? item.wordCount : 0,
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

/** 전체 Document 읽기 */
export function readAllChapters(): Chapter[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CHAPTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeChapter)
      .filter((item): item is Chapter => item !== null);
  } catch {
    return [];
  }
}

/** 전체 저장 (sortOrder 기준 정렬) */
export function writeAllChapters(chapters: Chapter[]): void {
  if (!canUseStorage()) return;

  const sorted = [...chapters].sort((a, b) => {
    if (a.projectId !== b.projectId) {
      return a.projectId.localeCompare(b.projectId);
    }
    return a.sortOrder - b.sortOrder;
  });
  window.localStorage.setItem(CHAPTERS_STORAGE_KEY, JSON.stringify(sorted));
}

/** 특정 작품의 Document만 (순서 순) */
export function readChaptersByProject(projectId: ProjectId): Chapter[] {
  return readAllChapters()
    .filter((chapter) => chapter.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createChapterId(): ChapterId {
  return crypto.randomUUID();
}

/**
 * Document 생성 — 목록 맨 끝.
 * 제목이 비어 있으면 "새 문서".
 */
export function createChapter(
  projectId: ProjectId,
  input: ChapterInput,
): Chapter {
  const all = readAllChapters();
  const siblings = all.filter((chapter) => chapter.projectId === projectId);
  const maxSort = siblings.reduce(
    (max, chapter) => Math.max(max, chapter.sortOrder),
    -1,
  );
  const timestamp = nowIso();
  const title = input.title.trim() || DEFAULT_DOCUMENT_TITLE;

  const chapter: Chapter = {
    id: createChapterId(),
    projectId,
    title,
    kind: input.kind,
    summary: input.description?.trim() || undefined,
    sortOrder: maxSort + 1,
    status: "planned",
    wordCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeAllChapters([...all, chapter]);
  return chapter;
}

/** Document 수정 (제목·종류·설명) */
export function updateChapter(
  id: ChapterId,
  input: ChapterInput,
): Chapter | null {
  const all = readAllChapters();
  const index = all.findIndex((chapter) => chapter.id === id);
  if (index < 0) return null;

  const title = input.title.trim() || DEFAULT_DOCUMENT_TITLE;

  const updated: Chapter = {
    ...all[index],
    title,
    kind: input.kind,
    summary: input.description?.trim() || undefined,
    updatedAt: nowIso(),
  };

  const next = [...all];
  next[index] = updated;
  writeAllChapters(next);
  return updated;
}

/** Document 삭제 + 같은 작품 sortOrder 재부여 */
export function deleteChapter(id: ChapterId): boolean {
  const all = readAllChapters();
  const target = all.find((chapter) => chapter.id === id);
  if (!target) return false;

  const remaining = all.filter((chapter) => chapter.id !== id);
  const renumbered = renumberProjectChapters(remaining, target.projectId);
  writeAllChapters(renumbered);
  return true;
}

/** 위/아래 이동 */
export function moveChapter(
  id: ChapterId,
  direction: "up" | "down",
): Chapter[] | null {
  const all = readAllChapters();
  const target = all.find((chapter) => chapter.id === id);
  if (!target) return null;

  const siblings = all
    .filter((chapter) => chapter.projectId === target.projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const index = siblings.findIndex((chapter) => chapter.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= siblings.length) {
    return readChaptersByProject(target.projectId);
  }

  const a = siblings[index];
  const b = siblings[swapWith];
  const orderA = a.sortOrder;
  const orderB = b.sortOrder;
  const timestamp = nowIso();

  const next = all.map((chapter) => {
    if (chapter.id === a.id) {
      return { ...chapter, sortOrder: orderB, updatedAt: timestamp };
    }
    if (chapter.id === b.id) {
      return { ...chapter, sortOrder: orderA, updatedAt: timestamp };
    }
    return chapter;
  });

  writeAllChapters(next);
  return readChaptersByProject(target.projectId);
}

function renumberProjectChapters(
  chapters: Chapter[],
  projectId: ProjectId,
): Chapter[] {
  const siblings = chapters
    .filter((chapter) => chapter.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const orderMap = new Map(
    siblings.map((chapter, index) => [chapter.id, index]),
  );

  return chapters.map((chapter) => {
    const nextOrder = orderMap.get(chapter.id);
    if (nextOrder === undefined) return chapter;
    if (chapter.sortOrder === nextOrder) return chapter;
    return { ...chapter, sortOrder: nextOrder };
  });
}

export function getChapterNumber(
  chapters: Chapter[],
  chapterId: ChapterId,
): number {
  const sorted = [...chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((chapter) => chapter.id === chapterId);
  return index >= 0 ? index + 1 : 0;
}

export function syncChapterAfterManuscriptWrite(
  chapterId: ChapterId,
  wordCount: number,
): void {
  const all = readAllChapters();
  const index = all.findIndex((chapter) => chapter.id === chapterId);
  if (index < 0) return;

  const next = [...all];
  next[index] = {
    ...all[index],
    wordCount,
    updatedAt: nowIso(),
  };
  writeAllChapters(next);
}
