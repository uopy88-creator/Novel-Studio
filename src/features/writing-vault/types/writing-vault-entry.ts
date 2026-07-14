/**
 * =============================================================================
 * Writing Vault Entry — 통합 타입
 * -----------------------------------------------------------------------------
 * sentence | word | memo | foreshadowing | inspiration
 * 모든 항목이 동일한 Storage / Repository / Mapper 를 사용한다.
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

/** 영감 출처 (sentence/word/inspiration 공통) */
export interface WritingVaultReference {
  workTitle: string;
  author: string;
  memo: string;
}

export function emptyWritingVaultReference(): WritingVaultReference {
  return { workTitle: "", author: "", memo: "" };
}

/**
 * 타입별 확장 필드.
 * UI·어댑터가 해석하며, DB 에는 meta jsonb 로 저장한다.
 */
export type WritingVaultMeta = Record<string, unknown>;

/**
 * Writing Vault 한 항목 — Single Source of Truth
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
  isPinned: boolean;
  sectionStableId?: string;
  documentId?: string;
  meta: WritingVaultMeta;
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

/** 레거시/입력값을 정규화 (idea → inspiration) */
export function normalizeWritingVaultType(value: unknown): WritingVaultType {
  if (value === "idea") return "inspiration";
  if (isWritingVaultType(value)) return value;
  return "sentence";
}
