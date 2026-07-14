/**
 * Writing Vault — 통합 공개 진입점 (타입 · storage · adapters)
 * UI 페이지는 `@/features/dialogue-vault` 의 WritingVaultPage 를 사용한다.
 */

export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
  WritingVaultMeta,
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
  toggleWritingVaultPin,
  updateWritingVaultEntry,
} from "./lib/writing-vault-storage";

export {
  memoFromVaultEntry,
  memoToVaultInput,
  foreshadowingFromVaultEntry,
  foreshadowingToVaultInput,
  inspirationFromVaultEntry,
  inspirationToVaultInput,
} from "./lib/adapters";
