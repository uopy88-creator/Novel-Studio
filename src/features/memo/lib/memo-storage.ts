/**
 * =============================================================================
 * Memo Storage — Writing Vault facade (type = memo)
 * -----------------------------------------------------------------------------
 * CRUD 는 writing-vault-storage 만 사용한다.
 * =============================================================================
 */

import type { Memo } from "@/features/memo/types/memo";
import type { MemoId, ProjectId } from "@/types/ids";
import {
  createWritingVaultEntry,
  deleteWritingVaultEntry,
  readAllWritingVaultEntries,
  readWritingVaultByProject,
  updateWritingVaultEntry,
} from "@/features/writing-vault/lib/writing-vault-storage";
import {
  memoFromVaultEntry,
  memoToVaultInput,
} from "@/features/writing-vault/lib/adapters";
import { MEMOS_STORAGE_KEY } from "@/lib/storage/keys";

export { MEMOS_STORAGE_KEY };

export interface MemoInput {
  body: string;
  kind?: Memo["kind"];
  isPinned?: boolean;
  isResolved?: boolean;
  sectionStableId?: Memo["sectionStableId"];
  sourceText?: Memo["sourceText"];
  chapterId?: Memo["chapterId"];
  characterId?: Memo["characterId"];
  foreshadowingId?: Memo["foreshadowingId"];
  tags?: string[];
}

export function createMemoId(): MemoId {
  return crypto.randomUUID();
}

export async function readAllMemos(): Promise<Memo[]> {
  const all = await readAllWritingVaultEntries();
  return all.filter((e) => e.type === "memo").map(memoFromVaultEntry);
}

export async function readMemosByProject(
  projectId: ProjectId,
): Promise<Memo[]> {
  const list = await readWritingVaultByProject(projectId, "memo");
  return list.map(memoFromVaultEntry);
}

export async function createMemo(
  projectId: ProjectId,
  input: MemoInput,
): Promise<Memo> {
  const entry = await createWritingVaultEntry(
    projectId,
    memoToVaultInput(input),
  );
  return memoFromVaultEntry(entry);
}

export async function updateMemo(
  id: MemoId,
  patch: Partial<MemoInput>,
): Promise<Memo | null> {
  const all = await readAllWritingVaultEntries();
  const current = all.find((e) => e.id === id && e.type === "memo");
  if (!current) return null;

  const memo = memoFromVaultEntry(current);
  const nextInput = memoToVaultInput({
    body: patch.body !== undefined ? patch.body : memo.body,
    kind: patch.kind ?? memo.kind,
    isPinned: patch.isPinned ?? memo.isPinned,
    isResolved: patch.isResolved ?? memo.isResolved,
    sectionStableId:
      patch.sectionStableId !== undefined
        ? patch.sectionStableId
        : memo.sectionStableId,
    sourceText:
      patch.sourceText !== undefined ? patch.sourceText : memo.sourceText,
    chapterId:
      patch.chapterId !== undefined ? patch.chapterId : memo.chapterId,
    characterId:
      patch.characterId !== undefined ? patch.characterId : memo.characterId,
    foreshadowingId:
      patch.foreshadowingId !== undefined
        ? patch.foreshadowingId
        : memo.foreshadowingId,
    tags: patch.tags ?? memo.tags,
  });

  const updated = await updateWritingVaultEntry(id, nextInput);
  return updated ? memoFromVaultEntry(updated) : null;
}

export async function deleteMemo(id: MemoId): Promise<boolean> {
  return deleteWritingVaultEntry(id);
}

export function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function filterMemos(memos: Memo[], query: string): Memo[] {
  const q = query.trim().toLowerCase();
  if (!q) return memos;
  return memos.filter(
    (m) =>
      m.body.toLowerCase().includes(q) ||
      (m.sourceText?.toLowerCase().includes(q) ?? false),
  );
}
