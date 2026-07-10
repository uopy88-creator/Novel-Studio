/**
 * =============================================================================
 * Chapter / Document Storage (Cloud 우선 + LocalStorage 백업)
 * -----------------------------------------------------------------------------
 * 온라인 시 Supabase `documents` 테이블. LocalStorage는 백업.
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
import { canUseCloudDb } from "@/database/supabase/cloud-mode";
import {
  cloudDeleteDocument,
  cloudListDocuments,
  cloudListDocumentsByProject,
  cloudUpsertDocument,
  cloudUpsertDocuments,
} from "@/database/supabase/documents-repo";
import { CHAPTERS_STORAGE_KEY } from "@/lib/storage/keys";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { CHAPTERS_STORAGE_KEY };

export interface ChapterInput {
  title: string;
  kind: DocumentKind;
  description?: string;
}

export type DocumentInput = ChapterInput;

function isDocumentKind(value: unknown): value is DocumentKind {
  return (
    typeof value === "string" &&
    (DOCUMENT_KIND_OPTIONS as string[]).includes(value)
  );
}

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

function readLocalAllChapters(): Chapter[] {
  return readJsonArray<unknown>(CHAPTERS_STORAGE_KEY)
    .map(normalizeChapter)
    .filter((item): item is Chapter => item !== null);
}

function writeLocalAllChapters(chapters: Chapter[]): void {
  const sorted = [...chapters].sort((a, b) => {
    if (a.projectId !== b.projectId) {
      return a.projectId.localeCompare(b.projectId);
    }
    return a.sortOrder - b.sortOrder;
  });
  writeJsonArray(CHAPTERS_STORAGE_KEY, sorted);
}

export function createChapterId(): ChapterId {
  return crypto.randomUUID();
}

export async function readAllChapters(): Promise<Chapter[]> {
  if (await canUseCloudDb()) {
    try {
      const chapters = await cloudListDocuments();
      writeLocalAllChapters(chapters);
      return chapters;
    } catch {
      return readLocalAllChapters();
    }
  }
  return readLocalAllChapters();
}

export async function writeAllChapters(chapters: Chapter[]): Promise<void> {
  writeLocalAllChapters(chapters);
  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDocuments(chapters);
    } catch {
      // 로컬 백업은 이미 저장됨
    }
  }
}

export async function readChaptersByProject(
  projectId: ProjectId,
): Promise<Chapter[]> {
  if (await canUseCloudDb()) {
    try {
      const chapters = await cloudListDocumentsByProject(projectId);
      // 해당 작품분만 로컬에 병합 백업
      const others = readLocalAllChapters().filter(
        (chapter) => chapter.projectId !== projectId,
      );
      writeLocalAllChapters([...others, ...chapters]);
      return chapters;
    } catch {
      // fall through
    }
  }

  return readLocalAllChapters()
    .filter((chapter) => chapter.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createChapter(
  projectId: ProjectId,
  input: ChapterInput,
): Promise<Chapter> {
  const siblings = await readChaptersByProject(projectId);
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

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDocument(chapter);
      const all = readLocalAllChapters();
      writeLocalAllChapters([...all.filter((c) => c.id !== chapter.id), chapter]);
      return chapter;
    } catch {
      // fall through
    }
  }

  const all = readLocalAllChapters();
  writeLocalAllChapters([...all, chapter]);
  return chapter;
}

export async function updateChapter(
  id: ChapterId,
  input: ChapterInput,
): Promise<Chapter | null> {
  const all = await readAllChapters();
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

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDocument(updated);
      const next = [...all];
      next[index] = updated;
      writeLocalAllChapters(next);
      return updated;
    } catch {
      // fall through
    }
  }

  const next = [...all];
  next[index] = updated;
  writeLocalAllChapters(next);
  return updated;
}

export async function deleteChapter(id: ChapterId): Promise<boolean> {
  const all = await readAllChapters();
  const target = all.find((chapter) => chapter.id === id);
  if (!target) return false;

  if (await canUseCloudDb()) {
    try {
      await cloudDeleteDocument(id);
      const remaining = all.filter((chapter) => chapter.id !== id);
      const renumbered = renumberProjectChapters(remaining, target.projectId);
      await cloudUpsertDocuments(
        renumbered.filter((chapter) => chapter.projectId === target.projectId),
      );
      writeLocalAllChapters(renumbered);
      return true;
    } catch {
      // fall through
    }
  }

  const remaining = all.filter((chapter) => chapter.id !== id);
  writeLocalAllChapters(renumberProjectChapters(remaining, target.projectId));
  return true;
}

export async function moveChapter(
  id: ChapterId,
  direction: "up" | "down",
): Promise<Chapter[] | null> {
  const all = await readAllChapters();
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

  const changed = next.filter(
    (chapter) => chapter.id === a.id || chapter.id === b.id,
  );

  writeLocalAllChapters(next);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDocuments(changed);
    } catch {
      // 로컬 백업 유지
    }
  }

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

export async function syncChapterAfterManuscriptWrite(
  chapterId: ChapterId,
  wordCount: number,
): Promise<void> {
  const all = await readAllChapters();
  const index = all.findIndex((chapter) => chapter.id === chapterId);
  if (index < 0) return;

  const updated: Chapter = {
    ...all[index],
    wordCount,
    updatedAt: nowIso(),
  };

  const next = [...all];
  next[index] = updated;
  writeLocalAllChapters(next);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDocument(updated);
    } catch {
      // 로컬 백업 유지
    }
  }
}
