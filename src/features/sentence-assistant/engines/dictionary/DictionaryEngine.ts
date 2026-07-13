/**
 * =============================================================================
 * Dictionary Engine — 국립국어원 표준국어대사전
 * -----------------------------------------------------------------------------
 * /api/dictionary 호출만 담당한다 (형태소 분석·lemma 캐시 없음).
 * 결과 캐시는 Core 가 DictionaryResultCache(lemma 키)로 관리한다.
 * error 는 캐시하지 않아 재시도 가능하다.
 * =============================================================================
 */

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
  /**
   * 주어진 검색어(q)로 API 조회.
   * Core 가 lemma / original 순으로 호출하며, 캐시는 Core 쪽에서 처리한다.
   */
  async lookup(
    rawQuery: string,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    const query = normalizeDictionaryQuery(rawQuery);
    if (!query) {
      return { status: "not_found", query: "" };
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

      if (data.status === "not_found" || response.status === 404) {
        return {
          status: "not_found",
          query: data.query?.trim() || query,
        };
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

      return {
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
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      console.error("[DictionaryEngine] network/parse error", error);
      return { status: "error", query };
    }
  }

  /** @deprecated Core / DictionaryResultCache.clear 사용 */
  clearCache(): void {
    // no-op — 캐시는 DictionaryResultCache 가 소유
  }
}

export const dictionaryEngine = new DictionaryEngine();
