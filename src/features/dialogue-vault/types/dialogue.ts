/**
 * =============================================================================
 * dialogue-vault types — writing-vault 재수출 (하위 호환 경로)
 * =============================================================================
 */

export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
  WritingVaultMeta,
} from "@/features/writing-vault/types/writing-vault-entry";

export {
  WRITING_VAULT_TYPES,
  WRITING_VAULT_TYPE_LABELS,
  emptyWritingVaultReference,
  isWritingVaultType,
  normalizeWritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";

/** @deprecated WritingVaultEntry 사용 */
export type { WritingVaultEntry as Dialogue } from "@/features/writing-vault/types/writing-vault-entry";
