/**
 * Writing Vault 도메인 타입 진입점.
 */
export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
} from "./dialogue";
export {
  WRITING_VAULT_TYPES,
  WRITING_VAULT_TYPE_LABELS,
  emptyWritingVaultReference,
  isWritingVaultType,
  normalizeWritingVaultType,
} from "./dialogue";
