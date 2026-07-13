/**
 * =============================================================================
 * Dictionary Engine — 국립국어원 표준국어대사전
 * -----------------------------------------------------------------------------
 * /api/dictionary 호출. 오류는 캐시하지 않아 재시도 가능하다.
 * 캐시는 CacheManager (namespace: dictionary) 만 사용한다.
 *
 * 형태소 분석은 하지 않는다.
 * Core 가 Sentence Engine 의 lemma(필요 시 original)를 넘긴 뒤 호출한다.
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

  /**
   * 주어진 검색어(q)로 API 조회.
   * Core 가 lemma / original 순으로 이 메서드를 호출한다.
   */
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
        // 오류는 캐시하지 않음 — 재시도 가능
        return { status: "error", query };
      }

      const entry = data.entry;
      const senses =
        Array.isArray(entry.senses) && entry.senses.length > 0
          ? entry.senses.slice(0, 2).map((s) => ({
              definition: s.definition.trim(),
              pos: s.pos?.trim() || null,
            }))
          : [
              {
                definition: entry.definition.trim(),
                pos: entry.pos?.trim() || null,
              },
            ];

      const result: DictionaryLookupResult = {
        status: "found",
        query: data.query?.trim() || query,
        entry: {
          query: entry.query || query,
          word: entry.word?.trim() || query,
          pos: senses[0]?.pos ?? (entry.pos?.trim() || null),
          definition: senses[0]?.definition ?? entry.definition.trim(),
          link: entry.link?.trim() || null,
          senses,
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
