/**
 * =============================================================================
 * ExpressionService
 * -----------------------------------------------------------------------------
 * 표현 탭 전용. DictionaryService 와 분리한다.
 * 유의어 · 관용 표현만 반환하며, 가나다순으로 정렬한다.
 * =============================================================================
 */

import { EXPRESSION_DATA } from "@/features/sentence-assistant/lib/expression-data";
import type { ExpressionLookupResult } from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

function sortHangul(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ko"),
  );
}

/**
 * 선택 텍스트에 대한 유의어 · 관용 표현을 조회한다.
 * 데이터에 없으면 빈 배열 (UI에서 「관련 표현을 찾을 수 없습니다.」).
 */
export function lookupExpressions(rawQuery: string): ExpressionLookupResult {
  const query = normalizeDictionaryQuery(rawQuery);
  if (!query) {
    return { query: "", synonyms: [], idioms: [] };
  }

  const entry = EXPRESSION_DATA[query];
  if (!entry) {
    return { query, synonyms: [], idioms: [] };
  }

  return {
    query,
    synonyms: sortHangul(entry.synonyms),
    idioms: sortHangul(entry.idioms),
  };
}

export const ExpressionService = {
  lookupExpressions,
};
