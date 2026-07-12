/**
 * =============================================================================
 * ExpressionService
 * -----------------------------------------------------------------------------
 * 「표현 바꾸기」탭 전용. Novel Studio 유의어 JSON DB 만 조회한다.
 * AI·문장 생성·관용 표현 추천은 하지 않는다.
 * =============================================================================
 */

import { getSynonymsFromIndex } from "@/data/synonyms";
import type { ExpressionLookupResult } from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

/**
 * 선택 단어에 대한 유의어 목록을 반환한다.
 * 없으면 빈 배열 (UI: 「등록된 유의어가 없습니다.」).
 */
export function lookupExpressions(rawQuery: string): ExpressionLookupResult {
  const query = normalizeDictionaryQuery(rawQuery);
  if (!query) {
    return { query: "", synonyms: [] };
  }

  return {
    query,
    synonyms: getSynonymsFromIndex(query),
  };
}

export const ExpressionService = {
  lookupExpressions,
};
