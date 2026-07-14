/**
 * =============================================================================
 * dialogue-storage — writing-vault-storage 재수출 (하위 호환 경로)
 * =============================================================================
 */

import type { WritingVaultEntryId, ProjectId } from "@/types/ids";
import type {
  WritingVaultEntry,
  WritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
import type { WritingVaultInput } from "@/features/writing-vault/lib/writing-vault-storage";
import {
  createWritingVaultEntry,
  createWritingVaultEntryId,
  deleteWritingVaultEntry,
  filterWritingVaultByType,
  filterWritingVaultEntries,
  parseTagsInput,
  readAllWritingVaultEntries,
  readWritingVaultByProject,
  toggleWritingVaultFavorite,
  updateWritingVaultEntry,
  WRITING_VAULT_STORAGE_KEY,
} from "@/features/writing-vault/lib/writing-vault-storage";
import { DIALOGUES_STORAGE_KEY } from "@/lib/storage/keys";

export { DIALOGUES_STORAGE_KEY, WRITING_VAULT_STORAGE_KEY };
export type { WritingVaultInput };
/** @deprecated WritingVaultInput 사용 */
export type DialogueInput = WritingVaultInput;

export { parseTagsInput };

export async function readAllDialogues(): Promise<WritingVaultEntry[]> {
  return readAllWritingVaultEntries();
}

export async function readDialoguesByProject(
  projectId: ProjectId,
): Promise<WritingVaultEntry[]> {
  return readWritingVaultByProject(projectId);
}

export async function createDialogue(
  projectId: ProjectId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry> {
  return createWritingVaultEntry(projectId, input);
}

export async function updateDialogue(
  id: WritingVaultEntryId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry | null> {
  return updateWritingVaultEntry(id, input);
}

export async function deleteDialogue(
  id: WritingVaultEntryId,
): Promise<boolean> {
  return deleteWritingVaultEntry(id);
}

export async function toggleDialogueFavorite(
  id: WritingVaultEntryId,
): Promise<WritingVaultEntry | null> {
  return toggleWritingVaultFavorite(id);
}

export function filterDialogues(
  entries: WritingVaultEntry[],
  query: string,
): WritingVaultEntry[] {
  return filterWritingVaultEntries(entries, query);
}

export function filterDialoguesByType(
  entries: WritingVaultEntry[],
  type: WritingVaultType | "all",
): WritingVaultEntry[] {
  return filterWritingVaultByType(entries, type);
}

export function createDialogueId(): WritingVaultEntryId {
  return createWritingVaultEntryId();
}
