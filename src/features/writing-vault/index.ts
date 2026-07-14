/**
 * Writing Vault — 타입 공개 진입점
 * CRUD / UI 는 @/features/dialogue-vault 를 사용한다.
 */

export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
} from "./types/writing-vault-entry";

export {
  WRITING_VAULT_TYPES,
  WRITING_VAULT_TYPE_LABELS,
  emptyWritingVaultReference,
  isWritingVaultType,
  normalizeWritingVaultType,
} from "./types/writing-vault-entry";

export type { WritingVaultInput } from "./lib/writing-vault-storage";

export {
  WRITING_VAULT_STORAGE_KEY,
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
} from "./lib/writing-vault-storage";
