/**
 * =============================================================================
 * Inspiration Storage (Cloud 우선 + LocalStorage 백업)
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { DocumentId, InspirationId, ProjectId } from "@/types/ids";
import { canUseCloudDb } from "@/database/supabase/cloud-mode";
import {
  cloudDeleteInspiration,
  cloudListInspirations,
  cloudListInspirationsByProject,
  cloudUpsertInspiration,
} from "@/database/supabase/inspirations-repo";
import { INSPIRATIONS_STORAGE_KEY } from "@/lib/storage/keys";
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
    createdAt,
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : createdAt,
  };
}

function readLocalInspirations(): Inspiration[] {
  return readJsonArray<unknown>(INSPIRATIONS_STORAGE_KEY)
    .map(normalizeInspiration)
    .filter((item): item is Inspiration => item !== null);
}

function writeLocalInspirations(items: Inspiration[]): void {
  writeJsonArray(INSPIRATIONS_STORAGE_KEY, items);
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
  if (await canUseCloudDb()) {
    try {
      const items = await cloudListInspirations();
      writeLocalInspirations(items);
      return items;
    } catch {
      return readLocalInspirations();
    }
  }
  return readLocalInspirations();
}

export async function readInspirationsByProject(
  projectId: ProjectId,
): Promise<Inspiration[]> {
  let list: Inspiration[];

  if (await canUseCloudDb()) {
    try {
      list = await cloudListInspirationsByProject(projectId);
      const others = readLocalInspirations().filter(
        (item) => item.projectId !== projectId,
      );
      writeLocalInspirations([...others, ...list]);
    } catch {
      list = readLocalInspirations().filter(
        (item) => item.projectId === projectId,
      );
    }
  } else {
    list = readLocalInspirations().filter(
      (item) => item.projectId === projectId,
    );
  }

  return sortInspirations(list, "recent");
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
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const local = readLocalInspirations();
  writeLocalInspirations([...local, inspiration]);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertInspiration(inspiration);
    } catch {
      // 로컬 백업 유지
    }
  }

  return inspiration;
}

export async function updateInspiration(
  id: InspirationId,
  input: InspirationInput,
): Promise<Inspiration | null> {
  const all = await readAllInspirations();
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

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertInspiration(updated);
    } catch {
      // 로컬 백업 유지
    }
  }

  return updated;
}

export async function deleteInspiration(id: InspirationId): Promise<boolean> {
  const all = await readAllInspirations();
  const exists = all.some((item) => item.id === id);
  if (!exists) return false;

  writeLocalInspirations(all.filter((item) => item.id !== id));

  if (await canUseCloudDb()) {
    try {
      await cloudDeleteInspiration(id);
    } catch {
      // 로컬 백업 유지
    }
  }

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
