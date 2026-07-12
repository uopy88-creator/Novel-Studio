/**
 * =============================================================================
 * ExpressionService
 * -----------------------------------------------------------------------------
 * 「표현 바꾸기」탭 전용. Novel Studio 유의어 JSON DB 만 조회한다.
 * AI·문장 생성·관용 표현 추천은 하지 않는다.
 *
 * 검색은 기본형(lemma) 기준:
 * 활용형 → 규칙으로 lemma 추정 → JSON 인덱스 조회 (캐시됨).
 * =============================================================================
 */

import { SYNONYM_INDEX, getSynonymsFromIndex } from "@/data/synonyms";
import { resolveExpressionLemma } from "@/features/sentence-assistant/lib/expression-lemma";
import type { ExpressionLookupResult } from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

/**
 * 선택 단어에 대한 유의어 목록을 반환한다.
 * 활용형이어도 기본형으로 찾아 유의어를 붙인다.
 * 없으면 빈 배열 (UI: 「등록된 유의어가 없습니다.」).
 */
export function lookupExpressions(rawQuery: string): ExpressionLookupResult {
  const query = normalizeDictionaryQuery(rawQuery);
  if (!query) {
    return { query: "", lemma: "", synonyms: [] };
  }

  const lemma = resolveExpressionLemma(query, SYNONYM_INDEX);
  return {
    query,
    lemma,
    synonyms: getSynonymsFromIndex(lemma),
  };
}

export const ExpressionService = {
  lookupExpressions,
};
