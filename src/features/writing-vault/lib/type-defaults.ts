/**
 * =============================================================================
 * Writing Vault — 타입별 기본값 (단일 확장 지점)
 * -----------------------------------------------------------------------------
 * 새 entry_type 을 추가할 때:
 * 1) writing-vault-entry.ts 의 WritingVaultType / WRITING_VAULT_TYPES / LABELS
 * 2) 여기 defaultMetaForType (필요 시)
 * 3) DB CHECK constraint migration
 * =============================================================================
 */

import type {
  WritingVaultMeta,
  WritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";

/** 타입별 기본 meta — UI·어댑터가 비어 있을 때 채운다 */
export function defaultMetaForType(type: WritingVaultType): WritingVaultMeta {
  switch (type) {
    case "memo":
      return {
        kind: "note",
        isResolved: false,
        sourceText: "",
        characterId: null,
        foreshadowingId: null,
      };
    case "foreshadowing":
      return {
        status: "planted",
        relatedCharacterIds: [],
        importance: 3,
      };
    case "inspiration":
      return {
        startOffset: 0,
        endOffset: 0,
      };
    case "sentence":
    case "word":
    default:
      return {};
  }
}
