/**
 * =============================================================================
 * Writing Vault Entry — 텍스트 저장소 단일 모델
 * -----------------------------------------------------------------------------
 * 원고 위치(document / section)와 연결하지 않는다.
 * =============================================================================
 */

import type { Timestamps } from "@/types/ids";
import type { ProjectId, WritingVaultEntryId } from "@/types/ids";

/** Writing Vault 항목 종류 (entry_type) */
export type WritingVaultType =
  | "sentence"
  | "word"
  | "memo"
  | "foreshadowing"
  | "inspiration";

export const WRITING_VAULT_TYPES: WritingVaultType[] = [
  "sentence",
  "word",
  "memo",
  "foreshadowing",
  "inspiration",
];

export const WRITING_VAULT_TYPE_LABELS: Record<WritingVaultType, string> = {
  sentence: "Sentence",
  word: "Word",
  memo: "Memo",
  foreshadowing: "Foreshadowing",
  inspiration: "Inspiration",
};

/** 영감 출처 (작품명·작가·메모) */
export interface WritingVaultReference {
  workTitle: string;
  author: string;
  memo: string;
}

export function emptyWritingVaultReference(): WritingVaultReference {
  return { workTitle: "", author: "", memo: "" };
}

/**
 * Writing Vault 한 항목.
 * 이 필드 외에는 두지 않는다. (documentId / sectionStableId / meta 금지)
 */
export interface WritingVaultEntry extends Timestamps {
  id: WritingVaultEntryId;
  projectId: ProjectId;
  type: WritingVaultType;
  title: string;
  content: string;
  tags: string[];
  reference: WritingVaultReference;
  isFavorite: boolean;
}

export function isWritingVaultType(value: unknown): value is WritingVaultType {
  return (
    value === "sentence" ||
    value === "word" ||
    value === "memo" ||
    value === "foreshadowing" ||
    value === "inspiration"
  );
}

/** 레거시 idea → inspiration */
export function normalizeWritingVaultType(value: unknown): WritingVaultType {
  if (value === "idea") return "inspiration";
  if (isWritingVaultType(value)) return value;
  return "sentence";
}
