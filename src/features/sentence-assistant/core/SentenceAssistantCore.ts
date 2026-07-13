/**
 * =============================================================================
 * Sentence Assistant — Core Engine
 * -----------------------------------------------------------------------------
 * UI 는 개별 Engine 을 직접 호출하지 않는다.
 * 모든 요청은 이 Core 를 거친다.
 *
 * 파이프라인:
 *   Selection → Sentence Engine (기본형 1회) → Dictionary / Synonym / ShowTell
 *
 * Sentence Engine 이 기본형 분석의 Single Source of Truth 이다.
 * =============================================================================
 */

import {
  sharedCacheManager,
  type CacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import {
  DictionaryResultCache,
  dictionaryResultCache as defaultDictionaryResultCache,
  fromDictionaryCacheRecord,
} from "@/features/sentence-assistant/cache/dictionary-result-cache";
import type {
  EngineId,
  SentenceAssistantEngine,
} from "@/features/sentence-assistant/core/engine-types";
import {
  DictionaryEngine,
  dictionaryEngine as defaultDictionaryEngine,
} from "@/features/sentence-assistant/engines/dictionary/DictionaryEngine";
import type { DictionaryLookupResult } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import {
  LemmaEngine,
  lemmaEngine as defaultLemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import {
  SentenceEngine,
  sentenceEngine as defaultSentenceEngine,
} from "@/features/sentence-assistant/engines/sentence/SentenceEngine";
import type { SentenceAnalysisResult } from "@/features/sentence-assistant/engines/sentence/sentence-types";
import {
  ShowTellEngine,
  showTellEngine as defaultShowTellEngine,
} from "@/features/sentence-assistant/engines/show-tell/ShowTellEngine";
import type {
  ShowTellAnalysis,
  ShowTellExampleResult,
  ShowTellKind,
  ShowTellStyleId,
} from "@/features/sentence-assistant/engines/show-tell/show-tell-types";
import {
  SynonymEngine,
  synonymEngine as defaultSynonymEngine,
} from "@/features/sentence-assistant/engines/synonym/SynonymEngine";
import type { SynonymLookupResult } from "@/features/sentence-assistant/engines/synonym/synonym-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

/** 통합 분석 결과 — 일부 필드만 실패해도 나머지는 채운다. */
export interface CoreAnalysisResult {
  query: string;
  lemma: string;
  /** Sentence Engine 구조화 결과 (SSOT) */
  analysis: SentenceAnalysisResult;
  dictionary: DictionaryLookupResult | null;
  dictionaryError: string | null;
  synonyms: SynonymLookupResult | null;
  synonymError: string | null;
  showTell: ShowTellAnalysis | null;
  showTellError: string | null;
}

export interface SentenceAssistantCoreOptions {
  cache?: CacheManager;
  sentence?: SentenceEngine;
  /** @deprecated SentenceEngine 내부 규칙용. 직접 쓰지 말 것. */
  lemma?: LemmaEngine;
  dictionary?: DictionaryEngine;
  /** 국립국어원 결과 캐시 (lemma 키). 미지정 시 cache 기반 인스턴스 */
  dictionaryResultCache?: DictionaryResultCache;
  synonym?: SynonymEngine;
  showTell?: ShowTellEngine;
}

function safeSync<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SentenceAssistantCore] engine error", message);
    return { ok: false, error: message };
  }
}

async function safeAsync<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name: string }).name === "AbortError"
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SentenceAssistantCore] engine error", message);
    return { ok: false, error: message };
  }
}

export class SentenceAssistantCore {
  readonly cache: CacheManager;
  readonly sentence: SentenceEngine;
  /** 규칙 엔진 — SentenceEngine 전용. 외부 기능은 sentence 를 사용. */
  readonly lemma: LemmaEngine;
  readonly dictionary: DictionaryEngine;
  /** 국립국어원 검색 결과 캐시 (key = lemma) */
  readonly dictionaryResultCache: DictionaryResultCache;
  readonly synonym: SynonymEngine;
  readonly showTell: ShowTellEngine;

  private readonly registry = new Map<EngineId, SentenceAssistantEngine>();
  /** 동일 lemma 동시 요청 → API 1회 */
  private readonly dictionaryInflight = new Map<
    string,
    Promise<DictionaryLookupResult>
  >();

  constructor(options: SentenceAssistantCoreOptions = {}) {
    this.cache = options.cache ?? sharedCacheManager;
    this.lemma = options.lemma ?? defaultLemmaEngine;
    this.sentence =
      options.sentence ??
      (options.lemma
        ? new SentenceEngine(options.lemma, this.cache)
        : defaultSentenceEngine);
    this.dictionary = options.dictionary ?? defaultDictionaryEngine;
    this.dictionaryResultCache =
      options.dictionaryResultCache ??
      (options.cache
        ? new DictionaryResultCache(options.cache)
        : defaultDictionaryResultCache);
    this.synonym = options.synonym ?? defaultSynonymEngine;
    this.showTell = options.showTell ?? defaultShowTellEngine;

    this.registerEngine("sentence", this.sentence as unknown as SentenceAssistantEngine);
    this.registerEngine("lemma", this.lemma as unknown as SentenceAssistantEngine);
    this.registerEngine("dictionary", this.dictionary as unknown as SentenceAssistantEngine);
    this.registerEngine("synonym", this.synonym as unknown as SentenceAssistantEngine);
    this.registerEngine("showTell", this.showTell as unknown as SentenceAssistantEngine);
  }

  normalizeQuery(raw: string): string {
    return normalizeDictionaryQuery(raw);
  }

  registerEngine(id: EngineId, engine: SentenceAssistantEngine): void {
    this.registry.set(id, engine);
  }

  getEngine<T extends SentenceAssistantEngine>(id: EngineId): T | undefined {
    return this.registry.get(id) as T | undefined;
  }

  /**
   * Sentence Engine — 기본형·품사 구조화 분석 (SSOT).
   * 동일 단어는 캐시로 재분석하지 않는다.
   */
  analyzeWord(rawWord: string): SentenceAnalysisResult {
    const result = safeSync(() => this.sentence.analyze(rawWord));
    if (result.ok) return result.value;
    const original = (rawWord ?? "").trim();
    const normalized = this.normalizeQuery(original);
    return {
      original,
      lemma: normalized || original,
      normalized,
      pos: "기타",
    };
  }

  /**
   * 기본형 문자열만 필요할 때. 내부적으로 analyzeWord 를 사용한다.
   */
  resolveLemma(rawWord: string): string {
    return this.analyzeWord(rawWord).lemma;
  }

  /**
   * Dictionary — Sentence Engine lemma 우선 검색 + lemma 키 캐시.
   * Cache 확인 → (miss) lemma API → (없음) original API → Cache 저장.
   * 오류는 throw / 캐시하지 않는다.
   */
  async lookupDefinition(
    rawQuery: string,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    const analysis = this.analyzeWord(rawQuery);
    return this.lookupDefinitionFromAnalysis(analysis, signal);
  }

  /**
   * 이미 분석된 Sentence Engine 결과로 사전 검색 (재분석 없음).
   * 캐시 키는 항상 lemma.
   */
  async lookupDefinitionFromAnalysis(
    analysis: SentenceAnalysisResult,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    if (!analysis.normalized) {
      return { status: "not_found", query: "" };
    }

    const original = analysis.normalized;
    const lemma = analysis.lemma || original;

    const cached = this.dictionaryResultCache.get(lemma);
    if (cached) {
      return fromDictionaryCacheRecord(cached, { original });
    }

    const inflight = this.dictionaryInflight.get(lemma);
    if (inflight) {
      const shared = await inflight;
      // original 은 호출마다 다를 수 있음 (걷다 / 걸었다)
      return {
        ...shared,
        original,
        lemma,
      };
    }

    const pending = this.fetchAndCacheDefinition(lemma, original, signal);
    this.dictionaryInflight.set(lemma, pending);
    try {
      return await pending;
    } finally {
      this.dictionaryInflight.delete(lemma);
    }
  }

  /** lemma 캐시 miss 시 API 조회 후 최소 데이터만 저장 */
  private async fetchAndCacheDefinition(
    lemma: string,
    original: string,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    const lemmaLookup = await safeAsync(() =>
      this.dictionary.lookup(lemma, signal),
    );
    if (!lemmaLookup.ok) {
      return { status: "error", query: lemma, lemma, original };
    }

    if (lemmaLookup.value.status === "found" && lemmaLookup.value.entry) {
      const entry = lemmaLookup.value.entry;
      const result: DictionaryLookupResult = {
        status: "found",
        query: lemma,
        lemma,
        original,
        matchedBy: "lemma",
        entry: {
          ...entry,
          query: lemma,
          word: entry.word?.trim() || lemma,
        },
      };
      this.dictionaryResultCache.setFromLookup(lemma, result);
      return result;
    }

    if (lemmaLookup.value.status === "error") {
      return { status: "error", query: lemma, lemma, original };
    }

    // lemma not_found → original 폴백 (다를 때만)
    if (original !== lemma) {
      const originalLookup = await safeAsync(() =>
        this.dictionary.lookup(original, signal),
      );
      if (!originalLookup.ok) {
        return { status: "error", query: lemma, lemma, original };
      }
      if (
        originalLookup.value.status === "found" &&
        originalLookup.value.entry
      ) {
        const entry = originalLookup.value.entry;
        const result: DictionaryLookupResult = {
          status: "found",
          query: entry.word?.trim() || original,
          lemma,
          original,
          matchedBy: "original",
          entry,
        };
        // 캐시 키는 항상 lemma — 같은 기본형 재선택 시 API 생략
        this.dictionaryResultCache.setFromLookup(lemma, result);
        return result;
      }
      if (originalLookup.value.status === "error") {
        return { status: "error", query: lemma, lemma, original };
      }
    }

    const notFound: DictionaryLookupResult = {
      status: "not_found",
      query: lemma,
      lemma,
      original,
    };
    this.dictionaryResultCache.setFromLookup(lemma, notFound);
    return notFound;
  }

  /**
   * Synonym — Sentence Engine 결과(lemma)를 재사용.
   * SynonymEngine 은 별도 형태소 분석을 하지 않는다.
   */
  lookupSynonyms(rawQuery: string): SynonymLookupResult {
    const analysis = this.analyzeWord(rawQuery);
    const result = safeSync(() => this.synonym.lookupWithAnalysis(analysis));
    if (result.ok) return result.value;
    return {
      query: analysis.normalized,
      lemma: analysis.lemma,
      synonyms: [],
    };
  }

  lookupExpressions(rawQuery: string): SynonymLookupResult {
    return this.lookupSynonyms(rawQuery);
  }

  analyzeShowTell(raw: string): ShowTellAnalysis | null {
    // 문장 단위 분석. 단어 lemma 가 필요하면 analyzeWord 결과를 함께 쓸 수 있다.
    const result = safeSync(() => this.showTell.analyze(raw));
    return result.ok ? result.value : null;
  }

  getShowTellCraftExamples(
    sentence: string,
    style: ShowTellStyleId,
  ): ShowTellExampleResult | null {
    const result = safeSync(() =>
      this.showTell.getCraftExamples(sentence, style),
    );
    return result.ok ? result.value : null;
  }

  /**
   * @deprecated getShowTellCraftExamples 사용.
   */
  getShowTellExample(
    sentence: string,
    targetKind: ShowTellKind,
    style: ShowTellStyleId,
  ): ShowTellExampleResult | null {
    void targetKind;
    return this.getShowTellCraftExamples(sentence, style);
  }

  /**
   * 선택 텍스트 통합 파이프라인.
   * Sentence Engine 은 한 번만 호출하고, 하위 기능이 lemma 를 공유한다.
   */
  async analyzeSelection(
    raw: string,
    signal?: AbortSignal,
  ): Promise<CoreAnalysisResult> {
    const analysis = this.analyzeWord(raw);
    const query = analysis.normalized;
    const lemma = analysis.lemma || query;

    const [dictionaryResult, synonymResult, showTellResult] =
      await Promise.all([
        // lemma → original 폴백은 lookupDefinitionFromAnalysis 안에서 처리
        this.lookupDefinitionFromAnalysis(analysis, signal).then((value) => ({
          ok: true as const,
          value,
        })),
        Promise.resolve(
          safeSync(() => this.synonym.lookupWithAnalysis(analysis)),
        ),
        Promise.resolve(safeSync(() => this.showTell.analyze(raw))),
      ]);

    return {
      query,
      lemma,
      analysis,
      dictionary: dictionaryResult.value,
      dictionaryError:
        dictionaryResult.value.status === "error"
          ? "dictionary lookup failed"
          : null,
      synonyms: synonymResult.ok ? synonymResult.value : null,
      synonymError: synonymResult.ok ? null : synonymResult.error,
      showTell: showTellResult.ok ? showTellResult.value : null,
      showTellError: showTellResult.ok ? null : showTellResult.error,
    };
  }

  clearAllCaches(): void {
    this.cache.clear();
  }
}

export const sentenceAssistantCore = new SentenceAssistantCore();
