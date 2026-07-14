/**
 * =============================================================================
 * Chapter / Document Storage — Supabase Database 단일 소스
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
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteDocument,
  cloudGetDocumentById,
  cloudListDocuments,
  cloudListDocumentsByProject,
  cloudUpsertDocument,
  cloudUpsertDocuments,
} from "@/database/supabase/documents-repo";
import { CHAPTERS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";
import { clearRecoveryDraft } from "@/features/manuscript/lib/manuscript-recovery-storage";


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

function backupChapters(chapters: Chapter[]): void {
  writeWorkDataBackup(CHAPTERS_STORAGE_KEY, chapters);
}

async function backupAllChaptersFromCloud(): Promise<void> {
  try {
    backupChapters(await cloudListDocuments());
  } catch {
    // 백업 실패는 본 저장에 영향 없음
  }
}

export function createChapterId(): ChapterId {
  return crypto.randomUUID();
}

export async function readAllChapters(): Promise<Chapter[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const chapters = await cloudListDocuments();
    backupChapters(chapters);
    return chapters;
  }
  return readLocalAllChapters();
}

export async function writeAllChapters(chapters: Chapter[]): Promise<void> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertDocuments(chapters);
    backupChapters(await cloudListDocuments());
    return;
  }
  writeLocalAllChapters(chapters);
}

export async function readChaptersByProject(
  projectId: ProjectId,
): Promise<Chapter[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const chapters = await cloudListDocumentsByProject(projectId);
    void backupAllChaptersFromCloud();
    return chapters.sort((a, b) => a.sortOrder - b.sortOrder);
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

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertDocument(chapter);
    void backupAllChaptersFromCloud();
    return chapter;
  }

  writeLocalAllChapters([...readLocalAllChapters(), chapter]);
  return chapter;
}

export async function updateChapter(
  id: ChapterId,
  input: ChapterInput,
): Promise<Chapter | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDocuments();
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
    await cloudUpsertDocument(updated);
    void backupAllChaptersFromCloud();
    return updated;
  }

  const all = readLocalAllChapters();
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
  writeLocalAllChapters(next);
  return updated;
}

export async function getChapterById(id: ChapterId): Promise<Chapter | null> {
  const all = await readAllChapters();
  return all.find((chapter) => chapter.id === id) ?? null;
}

/** Soft Delete — 휴지통 이동 */
export async function deleteChapter(id: ChapterId): Promise<boolean> {
  const { softDelete } = await import("@/features/trash/lib/trash-manager");
  return softDelete("document", id);
}

/** 영구삭제 / softDelete removeLive */
export async function purgeChapter(id: ChapterId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDocuments();
    const target = all.find((chapter) => chapter.id === id);
    if (!target) return false;

    await cloudDeleteDocument(id);
    clearRecoveryDraft(target.projectId, id);
    const remaining = all.filter((chapter) => chapter.id !== id);
    const renumbered = renumberProjectChapters(remaining, target.projectId);
    await cloudUpsertDocuments(
      renumbered.filter((chapter) => chapter.projectId === target.projectId),
    );
    backupChapters(renumbered);
    return true;
  }

  const all = readLocalAllChapters();
  const target = all.find((chapter) => chapter.id === id);
  if (!target) return false;
  const remaining = all.filter((chapter) => chapter.id !== id);
  writeLocalAllChapters(renumberProjectChapters(remaining, target.projectId));
  clearRecoveryDraft(target.projectId, id);
  return true;
}

export async function restoreChapterFromTrash(
  payload: unknown,
): Promise<boolean> {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as { chapter?: unknown; manuscript?: unknown };
  const chapter = normalizeChapter(data.chapter);
  if (!chapter) return false;

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertDocument(chapter);
    if (data.manuscript) {
      const { upsertManuscriptSnapshot } = await import(
        "@/features/manuscript/lib/manuscript-storage"
      );
      await upsertManuscriptSnapshot(data.manuscript);
    }
    void backupAllChaptersFromCloud();
    return true;
  }

  const others = readLocalAllChapters().filter((c) => c.id !== chapter.id);
  writeLocalAllChapters([...others, chapter]);
  if (data.manuscript) {
    const { upsertManuscriptSnapshot } = await import(
      "@/features/manuscript/lib/manuscript-storage"
    );
    await upsertManuscriptSnapshot(data.manuscript);
  }
  return true;
}

export async function moveChapter(
  id: ChapterId,
  direction: "up" | "down",
): Promise<Chapter[] | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDocuments();
    const target = all.find((chapter) => chapter.id === id);
    if (!target) return null;

    const siblings = all
      .filter((chapter) => chapter.projectId === target.projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const index = siblings.findIndex((chapter) => chapter.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= siblings.length) {
      return siblings;
    }

    const a = siblings[index];
    const b = siblings[swapWith];
    const timestamp = nowIso();
    const changed = [
      { ...a, sortOrder: b.sortOrder, updatedAt: timestamp },
      { ...b, sortOrder: a.sortOrder, updatedAt: timestamp },
    ];
    await cloudUpsertDocuments(changed);
    void backupAllChaptersFromCloud();
    return cloudListDocumentsByProject(target.projectId);
  }

  const all = readLocalAllChapters();
  const target = all.find((chapter) => chapter.id === id);
  if (!target) return null;

  const siblings = all
    .filter((chapter) => chapter.projectId === target.projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const index = siblings.findIndex((chapter) => chapter.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= siblings.length) {
    return siblings;
  }

  const a = siblings[index];
  const b = siblings[swapWith];
  const timestamp = nowIso();
  const next = all.map((chapter) => {
    if (chapter.id === a.id) {
      return { ...chapter, sortOrder: b.sortOrder, updatedAt: timestamp };
    }
    if (chapter.id === b.id) {
      return { ...chapter, sortOrder: a.sortOrder, updatedAt: timestamp };
    }
    return chapter;
  });
  writeLocalAllChapters(next);
  return next
    .filter((chapter) => chapter.projectId === target.projectId)
    .sort((x, y) => x.sortOrder - y.sortOrder);
}

/**
 * Drag & Drop 등으로 순서를 통째로 바꾼다.
 * orderedIds 순서대로 sortOrder 0..n-1 을 부여한다.
 */
export async function reorderChaptersByIds(
  projectId: ProjectId,
  orderedIds: ChapterId[],
): Promise<Chapter[]> {
  const timestamp = nowIso();

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDocuments();
    const siblings = all
      .filter((chapter) => chapter.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const byId = new Map(siblings.map((c) => [c.id, c]));
    const reordered: Chapter[] = [];
    orderedIds.forEach((id, index) => {
      const chapter = byId.get(id);
      if (!chapter) return;
      reordered.push({
        ...chapter,
        sortOrder: index,
        updatedAt: timestamp,
      });
      byId.delete(id);
    });
    for (const leftover of byId.values()) {
      reordered.push({
        ...leftover,
        sortOrder: reordered.length,
        updatedAt: timestamp,
      });
    }

    await cloudUpsertDocuments(reordered);
    void backupAllChaptersFromCloud();
    return reordered.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const all = readLocalAllChapters();
  const siblings = all
    .filter((chapter) => chapter.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const byId = new Map(siblings.map((c) => [c.id, c]));
  const reordered: Chapter[] = [];
  orderedIds.forEach((id, index) => {
    const chapter = byId.get(id);
    if (!chapter) return;
    reordered.push({
      ...chapter,
      sortOrder: index,
      updatedAt: timestamp,
    });
    byId.delete(id);
  });
  for (const leftover of byId.values()) {
    reordered.push({
      ...leftover,
      sortOrder: reordered.length,
      updatedAt: timestamp,
    });
  }

  const others = all.filter((chapter) => chapter.projectId !== projectId);
  writeLocalAllChapters([...others, ...reordered]);
  return reordered.sort((a, b) => a.sortOrder - b.sortOrder);
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
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    // 핫패스: 전체 documents 스캔/백업 없이 해당 행만 갱신
    const current = await cloudGetDocumentById(chapterId);
    if (!current) return;

    await cloudUpsertDocument({
      ...current,
      wordCount,
      updatedAt: nowIso(),
    });
    return;
  }

  const all = readLocalAllChapters();
  const index = all.findIndex((chapter) => chapter.id === chapterId);
  if (index < 0) return;
  const next = [...all];
  next[index] = {
    ...all[index],
    wordCount,
    updatedAt: nowIso(),
  };
  writeLocalAllChapters(next);
}
