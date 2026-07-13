/**
 * =============================================================================
 * Sentence Engine — Sentence Assistant 공통 기본형 분석 엔진 (SSOT)
 * -----------------------------------------------------------------------------
 * Selection → Sentence Engine → { original, lemma, normalized, pos }
 *                ↓
 *         뜻 검색 / 유의어 / Show·Tell / (향후 기능)
 *
 * - 형태소(기본형) 분석은 이 Engine 에서만 수행한다.
 * - 결과는 CacheManager(namespace: sentence) 에 저장해 반복 선택을 피한다.
 * - 실패 시 lemma = original (오류 throw 없음).
 * - LemmaEngine 규칙 엔진을 내부적으로 사용한다 (외부는 SentenceEngine 만).
 * =============================================================================
 */

import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import {
  LemmaEngine,
  lemmaEngine as defaultLemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import type {
  SentenceAnalysisResult,
  SentencePos,
} from "@/features/sentence-assistant/engines/sentence/sentence-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

const HANGUL_RE = /[\uAC00-\uD7A3]/;

/** 형용사로 자주 끝나는 어간 패턴 (휴리스틱) */
const ADJECTIVE_LEMMA_RE =
  /(춥다|덥다|아름답다|예쁘다|슬프다|아프다|좋다|많다|적다|크다|작다|길다|짧다|높다|낮다|넓다|좁다|새롭다|외롭다|즐겁다|기쁘다|무섭다|어렵다|쉽다|바쁘다)$/;

function guessPos(original: string, lemma: string): SentencePos {
  if (!HANGUL_RE.test(lemma)) return "기타";

  if (lemma.endsWith("다")) {
    if (ADJECTIVE_LEMMA_RE.test(lemma)) return "형용사";
    if (original !== lemma || /(었|았|였|했|는|고|며|운|은)$/.test(original)) {
      return "동사";
    }
    return "동사";
  }

  if (/(히|게)$/.test(lemma)) return "부사";
  return "명사";
}

export class SentenceEngine {
  readonly id = "sentence" as const;

  constructor(
    private readonly lemmaEngine: LemmaEngine = defaultLemmaEngine,
    private readonly cache: CacheManager = sharedCacheManager,
  ) {}

  /**
   * 선택 텍스트를 한 번 분석한다.
   * 같은 normalized 키는 캐시에서 재사용한다.
   */
  analyze(raw: string): SentenceAnalysisResult {
    const original = (raw ?? "").trim();
    const normalized = normalizeDictionaryQuery(original);

    if (!normalized) {
      return {
        original,
        lemma: "",
        normalized: "",
        pos: "기타",
      };
    }

    const cached = this.cache.get<SentenceAnalysisResult>(
      CACHE_NS.sentence,
      normalized,
    );
    if (cached) {
      return { ...cached, original };
    }

    let lemma: string;
    try {
      lemma = this.lemmaEngine.analyze(normalized);
    } catch {
      lemma = normalized;
    }

    if (!lemma) lemma = normalized;

    const result: SentenceAnalysisResult = {
      original,
      lemma,
      normalized,
      pos: guessPos(normalized, lemma),
    };

    this.cache.set(CACHE_NS.sentence, normalized, result);
    return { ...result, original };
  }

  clearCache(): void {
    this.cache.clearNamespace(CACHE_NS.sentence);
  }
}

export const sentenceEngine = new SentenceEngine();
