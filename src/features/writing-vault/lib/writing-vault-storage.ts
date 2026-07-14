/**
 * =============================================================================
 * writing-vault-storage — dialogue-storage 재수출
 * -----------------------------------------------------------------------------
 * Writing Vault CRUD 의 실제 구현은 dialogue-storage 이다.
 * =============================================================================
 */

export type { WritingVaultInput } from "@/features/dialogue-vault/lib/dialogue-storage";

export {
  WRITING_VAULT_STORAGE_KEY,
  DIALOGUES_STORAGE_KEY,
  createDialogueId as createWritingVaultEntryId,
  createDialogue as createWritingVaultEntry,
  updateDialogue as updateWritingVaultEntry,
  deleteDialogue as deleteWritingVaultEntry,
  readAllDialogues as readAllWritingVaultEntries,
  readDialoguesByProject as readWritingVaultByProject,
  toggleDialogueFavorite as toggleWritingVaultFavorite,
  filterDialogues as filterWritingVaultEntries,
  filterDialoguesByType as filterWritingVaultByType,
  parseTagsInput,
  normalizeWritingVaultEntry,
} from "@/features/dialogue-vault/lib/dialogue-storage";
