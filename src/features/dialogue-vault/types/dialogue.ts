/**
 * =============================================================================
 * Writing Vault Entry (구 Dialogue)
 * -----------------------------------------------------------------------------
 * sentence | word | idea 를 하나의 금고에서 관리합니다.
 * =============================================================================
 */

import type { Timestamps } from "@/types/ids";
import type { DialogueId, ProjectId } from "@/types/ids";

/** Writing Vault 항목 종류 */
export type WritingVaultType = "sentence" | "word" | "idea";

export const WRITING_VAULT_TYPES: WritingVaultType[] = [
  "sentence",
  "word",
  "idea",
];

export const WRITING_VAULT_TYPE_LABELS: Record<WritingVaultType, string> = {
  sentence: "문장",
  word: "단어",
  idea: "아이디어",
};

/** 영감을 받은 작품 (Reference) */
export interface WritingVaultReference {
  /** 작품명 */
  workTitle: string;
  /** 작가명 (선택) */
  author: string;
  /** 메모 */
  memo: string;
}

export function emptyWritingVaultReference(): WritingVaultReference {
  return { workTitle: "", author: "", memo: "" };
}

/**
 * Writing Vault 한 항목.
 * - type: sentence | word | idea
 * - title: 선택
 * - content: 본문 (필수)
 * - reference: 영감 출처 (선택 필드들의 묶음)
 */
export interface WritingVaultEntry extends Timestamps {
  id: DialogueId;
  projectId: ProjectId;
  type: WritingVaultType;
  title: string;
  content: string;
  tags: string[];
  reference: WritingVaultReference;
  /** 즐겨찾기(북마크) */
  isFavorite: boolean;
}

/** @deprecated WritingVaultEntry 사용 — 하위 호환 별칭 */
export type Dialogue = WritingVaultEntry;

export function isWritingVaultType(value: unknown): value is WritingVaultType {
  return (
    value === "sentence" || value === "word" || value === "idea"
  );
}
