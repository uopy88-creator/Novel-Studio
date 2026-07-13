/**
 * =============================================================================
 * Synonym Engine — Novel Studio 유의어 DB
 * -----------------------------------------------------------------------------
 * JSON 인덱스 조회.
 * 기본형은 Core / Lemma Engine 과 동일한 LemmaEngine 인스턴스로 분석한다.
 * (단어 뜻과 같은 엔진 — 중복 구현 없음)
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
   * Lemma Engine 으로 기본형을 맞춘 뒤 JSON 인덱스를 조회한다.
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

    // 인덱스에 있는 후보를 우선 — 없으면 analyze() 형태 추정
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
