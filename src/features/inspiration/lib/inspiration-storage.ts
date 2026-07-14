/**
 * =============================================================================
 * Inspiration Storage — Writing Vault facade (type = inspiration)
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { DocumentId, InspirationId, ProjectId } from "@/types/ids";
import {
  createWritingVaultEntry,
  deleteWritingVaultEntry,
  readAllWritingVaultEntries,
  readWritingVaultByProject,
  updateWritingVaultEntry,
} from "@/features/writing-vault/lib/writing-vault-storage";
import {
  inspirationFromVaultEntry,
  inspirationToVaultInput,
} from "@/features/writing-vault/lib/adapters";
import { INSPIRATIONS_STORAGE_KEY } from "@/lib/storage/keys";

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

function toInspirationList(
  entries: Awaited<ReturnType<typeof readAllWritingVaultEntries>>,
): Inspiration[] {
  return entries
    .filter((e) => e.type === "inspiration")
    .map(inspirationFromVaultEntry)
    .filter((item): item is Inspiration => item !== null);
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
  return toInspirationList(await readAllWritingVaultEntries());
}

export async function readInspirationsByProject(
  projectId: ProjectId,
): Promise<Inspiration[]> {
  const list = await readWritingVaultByProject(projectId, "inspiration");
  return sortInspirations(
    list
      .map(inspirationFromVaultEntry)
      .filter((item): item is Inspiration => item !== null),
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
  const entry = await createWritingVaultEntry(
    projectId,
    inspirationToVaultInput({
      documentId: params.documentId,
      selectedText: params.selectedText,
      workTitle: params.workTitle,
      author: params.author,
      memo: params.memo,
      startOffset: params.startOffset,
      endOffset: params.endOffset,
      sectionStableId: params.sectionStableId,
    }),
  );
  const item = inspirationFromVaultEntry(entry);
  if (!item) {
    throw new Error("Inspiration 저장에 실패했습니다.");
  }
  return item;
}

export async function updateInspiration(
  id: InspirationId,
  input: InspirationInput,
): Promise<Inspiration | null> {
  const all = await readAllWritingVaultEntries();
  const current = all.find((e) => e.id === id && e.type === "inspiration");
  if (!current) return null;

  const existing = inspirationFromVaultEntry(current);
  if (!existing) return null;

  const updated = await updateWritingVaultEntry(id, {
    type: "inspiration",
    title: "",
    content: existing.selectedText,
    tags: [],
    reference: {
      workTitle: input.workTitle.trim(),
      author: input.author.trim(),
      memo: input.memo.trim(),
    },
    sectionStableId: existing.sectionStableId,
    documentId: existing.documentId,
    meta: {
      startOffset: existing.startOffset,
      endOffset: existing.endOffset,
    },
  });

  return updated ? inspirationFromVaultEntry(updated) : null;
}

export async function deleteInspiration(id: InspirationId): Promise<boolean> {
  return deleteWritingVaultEntry(id);
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
