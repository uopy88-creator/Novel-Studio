/**
 * =============================================================================
 * Expression — 타입 (표현 바꾸기)
 * -----------------------------------------------------------------------------
 * 유의어 Chip 만 다룬다. 문장 생성·관용구·AI 추천은 포함하지 않는다.
 * =============================================================================
 */

export interface ExpressionLookupResult {
  query: string;
  /** 가나다순 · 최대 5개 */
  synonyms: string[];
}

export const EXPRESSION_NOT_FOUND_MESSAGE = "등록된 유의어가 없습니다.";

/** 원고에서 단어를 선택하지 않은 경우 */
export const EXPRESSION_NO_SELECTION_MESSAGE =
  "먼저 원고에서 단어를 선택해주세요.";

/** 교체 직후 Toast */
export const EXPRESSION_REPLACED_TOAST_MESSAGE = "표현이 변경되었습니다.";
