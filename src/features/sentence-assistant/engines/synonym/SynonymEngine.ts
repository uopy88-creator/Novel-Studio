/**
 * =============================================================================
 * Synonym Engine — Novel Studio 유의어 DB
 * -----------------------------------------------------------------------------
 * JSON 인덱스 조회.
 * 기본형은 Core 가 넘긴 Sentence Engine 결과를 사용한다.
 * (자체 형태소 분석 없음 — SSOT 유지)
 * =============================================================================
 */

import { SYNONYM_INDEX, getSynonymsFromIndex } from "@/data/synonyms";
import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import { generateLemmaCandidates } from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import type { SentenceAnalysisResult } from "@/features/sentence-assistant/engines/sentence/sentence-types";
import {
  SentenceEngine,
  sentenceEngine as defaultSentenceEngine,
} from "@/features/sentence-assistant/engines/sentence/SentenceEngine";
import type { SynonymLookupResult } from "@/features/sentence-assistant/engines/synonym/synonym-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

function pickLemmaForIndex(
  analysis: SentenceAnalysisResult,
): string {
  const query = analysis.normalized;
  const primary = analysis.lemma || query;
  if (!query) return "";

  if (SYNONYM_INDEX.has(primary)) return primary;
  if (SYNONYM_INDEX.has(query)) return query;

  // 이미 만든 후보만 검사 — 새 형태소 분석 없음
  const hit = generateLemmaCandidates(query).find((c) =>
    SYNONYM_INDEX.has(c),
  );
  return hit ?? primary;
}

export class SynonymEngine {
  constructor(
    private readonly sentence: SentenceEngine = defaultSentenceEngine,
    private readonly cache: CacheManager = sharedCacheManager,
  ) {}

  /**
   * Core 가 이미 분석한 Sentence Engine 결과를 받아 유의어만 조회한다.
   */
  lookupWithAnalysis(analysis: SentenceAnalysisResult): SynonymLookupResult {
    const query = analysis.normalized;
    if (!query) {
      return { query: "", lemma: "", synonyms: [] };
    }

    const cached = this.cache.get<SynonymLookupResult>(
      CACHE_NS.synonym,
      query,
    );
    if (cached) return cached;

    const lemma = pickLemmaForIndex(analysis);
    const result: SynonymLookupResult = {
      query,
      lemma,
      synonyms: getSynonymsFromIndex(lemma),
    };
    this.cache.set(CACHE_NS.synonym, query, result);
    return result;
  }

  /**
   * 단독 호출용 — Sentence Engine 을 한 번 사용한 뒤 인덱스를 조회한다.
   */
  lookup(rawQuery: string): SynonymLookupResult {
    const query = normalizeDictionaryQuery(rawQuery);
    if (!query) {
      return { query: "", lemma: "", synonyms: [] };
    }
    const analysis = this.sentence.analyze(query);
    return this.lookupWithAnalysis(analysis);
  }

  clearCache(): void {
    this.cache.clearNamespace(CACHE_NS.synonym);
  }
}

export const synonymEngine = new SynonymEngine();
