/**
 * =============================================================================
 * Inspiration Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { DocumentId, InspirationId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteInspiration,
  cloudListInspirations,
  cloudListInspirationsByProject,
  cloudUpsertInspiration,
} from "@/database/supabase/inspirations-repo";
import { INSPIRATIONS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { INSPIRATIONS_STORAGE_KEY };

export type InspirationSortMode = "recent" | "workTitle";

export interface InspirationInput {
  workTitle: string;
  author: string;
  memo: string;
}

export interface InspirationCreateParams extends InspirationInput {
  documentId: DocumentId;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  /** Section Registry ID — 오프셋에서 해석해 저장 */
  sectionStableId?: string;
}

function normalizeInspiration(raw: unknown): Inspiration | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Inspiration>;

  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }
  if (typeof item.documentId !== "string") return null;
  if (typeof item.selectedText !== "string") return null;
  if (typeof item.workTitle !== "string") return null;

  const createdAt =
    typeof item.createdAt === "string" ? item.createdAt : nowIso();

  return {
    id: item.id,
    projectId: item.projectId,
    documentId: item.documentId,
    selectedText: item.selectedText,
    workTitle: item.workTitle.trim(),
    author: typeof item.author === "string" ? item.author : "",
    memo: typeof item.memo === "string" ? item.memo : "",
    startOffset: typeof item.startOffset === "number" ? item.startOffset : 0,
    endOffset: typeof item.endOffset === "number" ? item.endOffset : 0,
    sectionStableId:
      typeof item.sectionStableId === "string" && item.sectionStableId
        ? item.sectionStableId
        : undefined,
    createdAt,
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : createdAt,
  };
}

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocalInspirations(): Inspiration[] {
  return readJsonArray<unknown>(INSPIRATIONS_STORAGE_KEY)
    .map(normalizeInspiration)
    .filter((item): item is Inspiration => item !== null);
}

function writeLocalInspirations(items: Inspiration[]): void {
  writeJsonArray(INSPIRATIONS_STORAGE_KEY, items);
}

function backupInspirations(items: Inspiration[]): void {
  writeWorkDataBackup(INSPIRATIONS_STORAGE_KEY, items);
}

function createInspirationId(): InspirationId {
  return crypto.randomUUID();
}

export function sortInspirations(
  items: Inspiration[],
  mode: InspirationSortMode,
): Inspiration[] {
  const list = [...items];
  if (mode === "workTitle") {
    list.sort((a, b) => {
      const byTitle = a.workTitle.localeCompare(b.workTitle, "ko");
      if (byTitle !== 0) return byTitle;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  } else {
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return list;
}

export function filterInspirations(
  items: Inspiration[],
  query: string,
): Inspiration[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;

  return items.filter((item) => {
    if (item.workTitle.toLowerCase().includes(needle)) return true;
    if (item.memo.toLowerCase().includes(needle)) return true;
    if (item.selectedText.toLowerCase().includes(needle)) return true;
    if (item.author.toLowerCase().includes(needle)) return true;
    return false;
  });
}

export async function readAllInspirations(): Promise<Inspiration[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const items = await cloudListInspirations();
    backupInspirations(items);
    return items;
  }
  return readLocalInspirations();
}

export async function readInspirationsByProject(
  projectId: ProjectId,
): Promise<Inspiration[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListInspirationsByProject(projectId);
    try {
      backupInspirations(await cloudListInspirations());
    } catch {
      // 백업 실패 무시
    }
    return sortInspirations(list, "recent");
  }

  return sortInspirations(
    readLocalInspirations().filter((item) => item.projectId === projectId),
    "recent",
  );
}

export async function readInspirationsByDocument(
  projectId: ProjectId,
  documentId: DocumentId,
): Promise<Inspiration[]> {
  const all = await readInspirationsByProject(projectId);
  return all
    .filter((item) => item.documentId === documentId)
    .sort((a, b) => a.startOffset - b.startOffset);
}

export async function createInspiration(
  projectId: ProjectId,
  params: InspirationCreateParams,
): Promise<Inspiration> {
  const timestamp = nowIso();
  const selectedText = params.selectedText.trim();
  const workTitle = params.workTitle.trim();

  const inspiration: Inspiration = {
    id: createInspirationId(),
    projectId,
    documentId: params.documentId,
    selectedText,
    workTitle,
    author: params.author.trim(),
    memo: params.memo.trim(),
    startOffset: params.startOffset,
    endOffset: params.endOffset,
    sectionStableId: params.sectionStableId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertInspiration(inspiration);
    try {
      backupInspirations(await cloudListInspirations());
    } catch {
      // 백업 실패 무시
    }
    return inspiration;
  }

  writeLocalInspirations([...readLocalInspirations(), inspiration]);
  return inspiration;
}

export async function updateInspiration(
  id: InspirationId,
  input: InspirationInput,
): Promise<Inspiration | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListInspirations();
    const index = all.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const updated: Inspiration = {
      ...all[index],
      workTitle: input.workTitle.trim(),
      author: input.author.trim(),
      memo: input.memo.trim(),
      updatedAt: nowIso(),
    };
    await cloudUpsertInspiration(updated);
    try {
      backupInspirations(await cloudListInspirations());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalInspirations();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const updated: Inspiration = {
    ...all[index],
    workTitle: input.workTitle.trim(),
    author: input.author.trim(),
    memo: input.memo.trim(),
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalInspirations(next);
  return updated;
}

export async function deleteInspiration(id: InspirationId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListInspirations();
    if (!all.some((item) => item.id === id)) return false;
    await cloudDeleteInspiration(id);
    try {
      backupInspirations(await cloudListInspirations());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const all = readLocalInspirations();
  if (!all.some((item) => item.id === id)) return false;
  writeLocalInspirations(all.filter((item) => item.id !== id));
  return true;
}

/** Dashboard — 최근 3개 */
export function pickRecentInspirations(
  items: Inspiration[],
  limit = 3,
): Inspiration[] {
  return sortInspirations(items, "recent").slice(0, limit);
}

/** 카드용 미리보기 텍스트 */
export function previewText(text: string, max = 48): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}
