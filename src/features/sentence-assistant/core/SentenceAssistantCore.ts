/**
 * =============================================================================
 * Sentence Assistant — Core Engine
 * -----------------------------------------------------------------------------
 * UI 는 개별 Engine 을 직접 호출하지 않는다.
 * 모든 요청은 이 Core 를 거친다.
 *
 * 파이프라인 예 (선택 단어 「걸었다」):
 *   normalize → Lemma → Dictionary / Synonym / ShowTell
 *
 * 오류 격리:
 *   Dictionary 실패해도 Synonym·ShowTell 은 계속 동작한다.
 *
 * 확장:
 *   registerEngine("grammar", engine) 으로 새 Engine 추가.
 * =============================================================================
 */

import {
  sharedCacheManager,
  type CacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import type { EngineId, SentenceAssistantEngine } from "@/features/sentence-assistant/core/engine-types";
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
  dictionary: DictionaryLookupResult | null;
  dictionaryError: string | null;
  synonyms: SynonymLookupResult | null;
  synonymError: string | null;
  showTell: ShowTellAnalysis | null;
  showTellError: string | null;
}

export interface SentenceAssistantCoreOptions {
  cache?: CacheManager;
  lemma?: LemmaEngine;
  dictionary?: DictionaryEngine;
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
    // Abort 는 상위로 전달 (탭 전환 등)
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
  readonly lemma: LemmaEngine;
  readonly dictionary: DictionaryEngine;
  readonly synonym: SynonymEngine;
  readonly showTell: ShowTellEngine;

  /** 확장 Engine 레지스트리 */
  private readonly registry = new Map<EngineId, SentenceAssistantEngine>();

  constructor(options: SentenceAssistantCoreOptions = {}) {
    this.cache = options.cache ?? sharedCacheManager;
    this.lemma = options.lemma ?? defaultLemmaEngine;
    this.dictionary = options.dictionary ?? defaultDictionaryEngine;
    this.synonym = options.synonym ?? defaultSynonymEngine;
    this.showTell = options.showTell ?? defaultShowTellEngine;

    this.registerEngine("lemma", this.lemma as unknown as SentenceAssistantEngine);
    this.registerEngine("dictionary", this.dictionary as unknown as SentenceAssistantEngine);
    this.registerEngine("synonym", this.synonym as unknown as SentenceAssistantEngine);
    this.registerEngine("showTell", this.showTell as unknown as SentenceAssistantEngine);
  }

  /** 검색어 정규화 — UI·Engine 공통 */
  normalizeQuery(raw: string): string {
    return normalizeDictionaryQuery(raw);
  }

  /**
   * 새 Engine 등록 (Grammar / Style / ReadingTime 등).
   * 동일 id 는 덮어쓴다.
   */
  registerEngine(id: EngineId, engine: SentenceAssistantEngine): void {
    this.registry.set(id, engine);
  }

  getEngine<T extends SentenceAssistantEngine>(id: EngineId): T | undefined {
    return this.registry.get(id) as T | undefined;
  }

  /**
   * 공통 Lemma — Dictionary / Synonym / 향후 Engine 이 동일 경로를 쓴다.
   * 형태 규칙만으로 분석한다 (표제어 인덱스 무관).
   * 실패 시 원문 반환.
   */
  resolveLemma(rawWord: string): string {
    const query = this.normalizeQuery(rawWord);
    if (!query) return "";
    const result = safeSync(() => this.lemma.analyze(query));
    return result.ok ? result.value : query;
  }

  /**
   * Dictionary Engine — 뜻 조회
   * 반드시 Lemma Engine 결과(기본형)로 API 를 호출한다.
   * 예) 걸었다 → 걷다 → 국립국어원 검색
   */
  async lookupDefinition(
    rawQuery: string,
    signal?: AbortSignal,
  ): Promise<DictionaryLookupResult> {
    const surface = this.normalizeQuery(rawQuery);
    if (!surface) {
      return { status: "not_found", query: "" };
    }

    const lemma = this.resolveLemma(surface);
    const result = await safeAsync(() =>
      this.dictionary.lookup(lemma, signal),
    );
    if (result.ok) {
      // query 필드는 실제 검색에 쓴 기본형으로 통일
      return { ...result.value, query: lemma };
    }
    return {
      status: "error",
      query: lemma,
    };
  }

  /**
   * Synonym Engine — 유의어 조회
   * 동일한 Lemma Engine 결과(기본형)를 사용한다.
   * SynonymEngine 내부에서도 lemma.resolve(인덱스 우선)를 호출한다.
   */
  lookupSynonyms(rawQuery: string): SynonymLookupResult {
    const result = safeSync(() => this.synonym.lookup(rawQuery));
    if (result.ok) return result.value;
    const query = this.normalizeQuery(rawQuery);
    const lemma = this.resolveLemma(query);
    return { query, lemma, synonyms: [] };
  }

  /** 기존 ExpressionService API 이름 호환 */
  lookupExpressions(rawQuery: string): SynonymLookupResult {
    return this.lookupSynonyms(rawQuery);
  }

  /** ShowTell Engine — 분석 */
  analyzeShowTell(raw: string): ShowTellAnalysis | null {
    const result = safeSync(() => this.showTell.analyze(raw));
    return result.ok ? result.value : null;
  }

  /**
   * ShowTell Engine — Tell → Show 작법 방향의 독립 예시(여러 개).
   * 선택 문장을 재작성하지 않는다.
   */
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
   * targetKind 는 무시한다 (Tell 전용 작법 예시만 제공).
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
   * 선택 텍스트에 대한 통합 파이프라인.
   * 한 Engine 실패가 다른 Engine 결과를 막지 않는다.
   */
  async analyzeSelection(
    raw: string,
    signal?: AbortSignal,
  ): Promise<CoreAnalysisResult> {
    const query = this.normalizeQuery(raw);
    const lemma = this.resolveLemma(query);

    const [dictionaryResult, synonymResult, showTellResult] =
      await Promise.all([
        // Dictionary 도 기본형으로 검색
        safeAsync(() => this.dictionary.lookup(lemma, signal)),
        Promise.resolve(safeSync(() => this.synonym.lookup(query))),
        Promise.resolve(safeSync(() => this.showTell.analyze(raw))),
      ]);

    return {
      query,
      lemma,
      dictionary: dictionaryResult.ok
        ? { ...dictionaryResult.value, query: lemma }
        : null,
      dictionaryError: dictionaryResult.ok ? null : dictionaryResult.error,
      synonyms: synonymResult.ok ? synonymResult.value : null,
      synonymError: synonymResult.ok ? null : synonymResult.error,
      showTell: showTellResult.ok ? showTellResult.value : null,
      showTellError: showTellResult.ok ? null : showTellResult.error,
    };
  }

  /** 공통 캐시 전체 비우기 (테스트·개발) */
  clearAllCaches(): void {
    this.cache.clear();
  }
}

/** 앱 전역 Core 인스턴스 — UI 는 이것만 호출한다. */
export const sentenceAssistantCore = new SentenceAssistantCore();
