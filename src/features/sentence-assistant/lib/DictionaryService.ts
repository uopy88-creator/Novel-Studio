/**
 * =============================================================================
 * DictionaryService (클라이언트)
 * -----------------------------------------------------------------------------
 * 단어 탭 전용. /api/dictionary 를 호출한다.
 * 같은 검색어는 메모리 캐시로 반복 API 호출을 막는다.
 * =============================================================================
 */

import type {
  DictionaryEntry,
  DictionaryLookupResult,
} from "@/features/sentence-assistant/lib/dictionary-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

/** 세션 동안 유지되는 인메모리 캐시 (탭/패널 재사용) */
const lookupCache = new Map<string, DictionaryLookupResult>();

interface ApiPayload {
  status?: string;
  query?: string;
  entry?: DictionaryEntry;
  message?: string;
}

export async function lookupDefinition(
  rawQuery: string,
  signal?: AbortSignal,
): Promise<DictionaryLookupResult> {
  const query = normalizeDictionaryQuery(rawQuery);
  if (!query) {
    return { status: "not_found", query: "" };
  }

  const cached = lookupCache.get(query);
  if (cached) {
    return cached;
  }

  const url = `/api/dictionary?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
      cache: "no-store",
    });

    const data = (await response.json()) as ApiPayload;

    // 서버가 not_found 를 정상 응답한 경우
    if (data.status === "not_found" || response.status === 404) {
      const result: DictionaryLookupResult = {
        status: "not_found",
        query: data.query?.trim() || query,
      };
      lookupCache.set(query, result);
      return result;
    }

    if (
      !response.ok ||
      data.status === "error" ||
      data.status !== "found" ||
      !data.entry
    ) {
      console.error("[DictionaryService] lookup failed", {
        httpStatus: response.status,
        body: data,
      });
      // 오류는 캐시하지 않음 — 재시도 가능
      return { status: "error", query };
    }

    const entry = data.entry;
    const result: DictionaryLookupResult = {
      status: "found",
      query: data.query?.trim() || query,
      entry: {
        query: entry.query || query,
        word: entry.word?.trim() || query,
        pos: entry.pos?.trim() || null,
        definition: entry.definition.trim(),
        link: entry.link?.trim() || null,
      },
    };
    lookupCache.set(query, result);
    return result;
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    console.error("[DictionaryService] network/parse error", error);
    return { status: "error", query };
  }
}

/** 테스트·수동 무효화용 */
export function clearDictionaryCache(): void {
  lookupCache.clear();
}

/** 테스트·확장용 별칭 */
export const DictionaryService = {
  lookupDefinition,
  normalizeQuery: normalizeDictionaryQuery,
  clearCache: clearDictionaryCache,
};
