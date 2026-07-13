/**
 * =============================================================================
 * Synonym Engine — Novel Studio 유의어 DB
 * -----------------------------------------------------------------------------
 * JSON 인덱스 조회. Lemma Engine 으로 활용형을 기본형으로 맞춘 뒤 검색한다.
 * =============================================================================
 */

import { SYNONYM_INDEX, getSynonymsFromIndex } from "@/data/synonyms";
import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import {
  LemmaEngine,
  lemmaEngine as defaultLemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import type { SynonymLookupResult } from "@/features/sentence-assistant/engines/synonym/synonym-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

export class SynonymEngine {
  constructor(
    private readonly lemma: LemmaEngine = defaultLemmaEngine,
    private readonly cache: CacheManager = sharedCacheManager,
  ) {}

  /**
   * 선택 단어에 대한 유의어 목록을 반환한다.
   * 활용형이어도 기본형으로 찾아 유의어를 붙인다.
   */
  lookup(rawQuery: string): SynonymLookupResult {
    const query = normalizeDictionaryQuery(rawQuery);
    if (!query) {
      return { query: "", lemma: "", synonyms: [] };
    }

    const cached = this.cache.get<SynonymLookupResult>(
      CACHE_NS.synonym,
      query,
    );
    if (cached) return cached;

    const lemma = this.lemma.resolve(query, SYNONYM_INDEX);
    const result: SynonymLookupResult = {
      query,
      lemma,
      synonyms: getSynonymsFromIndex(lemma),
    };
    this.cache.set(CACHE_NS.synonym, query, result);
    return result;
  }

  clearCache(): void {
    this.cache.clearNamespace(CACHE_NS.synonym);
  }
}

export const synonymEngine = new SynonymEngine();
