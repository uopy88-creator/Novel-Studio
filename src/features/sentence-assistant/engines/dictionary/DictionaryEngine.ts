/**
 * =============================================================================
 * Dictionary Engine — 국립국어원 표준국어대사전
 * -----------------------------------------------------------------------------
 * /api/dictionary 호출. 오류는 캐시하지 않아 재시도 가능하다.
 * 캐시는 CacheManager (namespace: dictionary) 만 사용한다.
 * =============================================================================
 */

import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import type {
  DictionaryEntry,
  DictionaryLookupResult,
} from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

interface ApiPayload {
  status?: string;
  query?: string;
  entry?: DictionaryEntry;
  message?: string;
}

export class DictionaryEngine {
  constructor(private readonly cache: CacheManager = sharedCacheManager) {}

  async lookup(
    rawQuery: string,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    const query = normalizeDictionaryQuery(rawQuery);
    if (!query) {
      return { status: "not_found", query: "" };
    }

    const cached = this.cache.get<DictionaryLookupResult>(
      CACHE_NS.dictionary,
      query,
    );
    if (cached) return cached;

    const url = `/api/dictionary?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
        cache: "no-store",
      });

      const data = (await response.json()) as ApiPayload;

      if (data.status === "not_found" || response.status === 404) {
        const result: DictionaryLookupResult = {
          status: "not_found",
          query: data.query?.trim() || query,
        };
        this.cache.set(CACHE_NS.dictionary, query, result);
        return result;
      }

      if (
        !response.ok ||
        data.status === "error" ||
        data.status !== "found" ||
        !data.entry
      ) {
        console.error("[DictionaryEngine] lookup failed", {
          httpStatus: response.status,
          body: data,
        });
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
      this.cache.set(CACHE_NS.dictionary, query, result);
      return result;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      console.error("[DictionaryEngine] network/parse error", error);
      return { status: "error", query };
    }
  }

  clearCache(): void {
    this.cache.clearNamespace(CACHE_NS.dictionary);
  }
}

export const dictionaryEngine = new DictionaryEngine();
