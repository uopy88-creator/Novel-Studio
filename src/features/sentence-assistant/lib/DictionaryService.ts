/**
 * =============================================================================
 * DictionaryService (클라이언트)
 * -----------------------------------------------------------------------------
 * 단어 탭 전용. /api/dictionary 를 호출해 「뜻」만 가져온다.
 * =============================================================================
 */

import type { DictionaryLookupResult } from "@/features/sentence-assistant/lib/dictionary-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export async function lookupDefinition(
  rawQuery: string,
  signal?: AbortSignal,
): Promise<DictionaryLookupResult> {
  const query = normalizeDictionaryQuery(rawQuery);
  if (!query) {
    return { query: "", definition: null };
  }

  const url = `/api/dictionary?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    return { query, definition: null };
  }

  const data = (await response.json()) as {
    query?: string;
    definition?: string | null;
    source?: string;
  };

  return {
    query: data.query?.trim() || query,
    definition:
      typeof data.definition === "string" && data.definition.trim()
        ? data.definition.trim()
        : null,
    source: data.source,
  };
}

/** 테스트·확장용 별칭 */
export const DictionaryService = {
  lookupDefinition,
  normalizeQuery: normalizeDictionaryQuery,
};
