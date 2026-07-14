/**
 * =============================================================================
 * dialogue-vault types — WritingVaultEntry 재수출
 * =============================================================================
 */

export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
} from "@/features/writing-vault/types/writing-vault-entry";

export {
  WRITING_VAULT_TYPES,
  WRITING_VAULT_TYPE_LABELS,
  emptyWritingVaultReference,
  isWritingVaultType,
  normalizeWritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
