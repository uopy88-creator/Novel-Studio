/**
 * =============================================================================
 * Lemma Engine — 활용형 → 기본형(lemma)
 * -----------------------------------------------------------------------------
 * Sentence Assistant 공통 기본형 분석기.
 * - 단어 뜻 (Dictionary) 과 표현 바꾸기 (Synonym) 가 동일한 엔진을 사용한다.
 * - AI / 외부 형태소 분석기 없음. 짧은 접미·음절 규칙만 사용한다.
 * - 캐시는 CacheManager (namespace: lemma) 만 사용한다. (중복 분석 방지)
 *
 * 실패 시: 원문을 그대로 반환한다. 검색을 중단하지 않는다.
 *
 * 예)
 *   걸었다 → 걷다
 *   걷는다 → 걷다
 *   걷고   → 걷다
 *   좋았다 → 좋다
 *   예뻤다 → 예쁘다
 *   웃었다 → 웃다
 *   웃는다 → 웃다
 *   바라봤다 → 바라보다
 *   생각했다 → 생각하다
 *   사랑했다 → 사랑하다
 * =============================================================================
 */

import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import {
  composeHangul,
  decomposeHangul,
  jungIndex,
} from "@/features/sentence-assistant/engines/lemma/hangul-syllable";

/** 종성 ㄷ 인덱스 (JONGSEONG) — ㄷ 불규칙(걷다↔걸었다) */
const JONG_DIGEUT = 7;

/**
 * 접미 규칙 (긴 것 우선).
 * 동일 입력에 여러 규칙이 맞으면 위쪽(긴 접미)을 먼저 후보에 넣는다.
 */
const SUFFIX_RULES: ReadonlyArray<{
  suffix: string;
  toCandidate: (stem: string) => string[];
}> = [
  { suffix: "는다가", toCandidate: (stem) => [`${stem}다`] },
  { suffix: "는다고", toCandidate: (stem) => [`${stem}다`] },
  { suffix: "었다", toCandidate: (stem) => candidatesAfterEotPast(stem) },
  { suffix: "았다", toCandidate: (stem) => [`${stem}다`] },
  { suffix: "였다", toCandidate: (stem) => [`${stem}다`, `${stem}이다`] },
  {
    suffix: "했다",
    toCandidate: (stem) => (stem ? [`${stem}하다`] : ["하다"]),
  },
  {
    suffix: "한다",
    toCandidate: (stem) => (stem ? [`${stem}하다`] : ["하다"]),
  },
  { suffix: "는다", toCandidate: (stem) => [`${stem}다`] },
  { suffix: "하고", toCandidate: (stem) => [`${stem}하다`] },
  { suffix: "하며", toCandidate: (stem) => [`${stem}하다`] },
  // 연결어미 「고」: 걷고 → 걷다 (단일 단어 선택 가정)
  { suffix: "고", toCandidate: (stem) => [`${stem}다`] },
];

/** 걸었다 → 걷다(ㄷ불규칙) / 걸다 */
function candidatesAfterEotPast(stem: string): string[] {
  const out: string[] = [];
  if (!stem) return ["다"];

  const last = stem[stem.length - 1];
  const parts = decomposeHangul(last);
  // ㄷ 불규칙: 걷다 ↔ 걸었다 (받침 ㄹ → ㄷ) — 사전·유의어 공통으로 불규칙을 우선
  if (parts && parts.jongChar === "ㄹ") {
    const restored = composeHangul(parts.cho, parts.jung, JONG_DIGEUT);
    out.push(`${stem.slice(0, -1)}${restored}다`);
  }
  out.push(`${stem}다`);
  return unique(out);
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

/**
 * 계약형 과거: 슬펐다·봤다·예뻤다·웃었다 처럼
 * 「… + (ㅆ받침 음절) + 다」
 */
function candidatesFromContractedPast(word: string): string[] {
  if (!word.endsWith("다") || word.length < 2) return [];
  const chars = Array.from(word);
  const stemSyllable = chars[chars.length - 2];
  const parts = decomposeHangul(stemSyllable);
  if (!parts || parts.jongChar !== "ㅆ") return [];

  const prefix = chars.slice(0, -2).join("");
  const out: string[] = [];

  // 모음 축약·불규칙 복원을 먼저 두어 analyze() 첫 후보가 사전형에 가깝게 한다.

  // ㅓ+ㅆ ← ㅡ다 (슬펐다 → 슬프다, 예뻤다 → 예쁘다)
  if (parts.jungChar === "ㅓ") {
    const eu = jungIndex("ㅡ");
    if (eu >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, eu, 0)}다`);
    }
  }

  // ㅏ+ㅆ ← ㅏ다 / ㅗ 축약 후보
  if (parts.jungChar === "ㅏ") {
    out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);
    const o = jungIndex("ㅗ");
    if (o >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, o, 0)}다`);
    }
  }

  // ㅘ+ㅆ ← ㅗ다 (봤다 → 보다, 바라봤다 → 바라보다)
  if (parts.jungChar === "ㅘ") {
    const o = jungIndex("ㅗ");
    if (o >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, o, 0)}다`);
    }
  }

  // ㅝ+ㅆ ← ㅜ다 (줬다 → 주다)
  if (parts.jungChar === "ㅝ") {
    const u = jungIndex("ㅜ");
    if (u >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, u, 0)}다`);
    }
  }

  // ㅐ+ㅆ ← 하다 축약 등
  if (parts.jungChar === "ㅐ") {
    out.push(`${prefix}하다`);
    out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);
  }

  // ㅆ만 제거 (후순위: 웃었다는 접미 「었다」로 먼저 처리되는 경우가 많음)
  out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);

  return unique(out);
}

/**
 * 규칙 순서로 lemma 후보를 만든다 (인덱스 검사 전).
 * 원문과 같은 후보는 제외한다.
 */
export function generateLemmaCandidates(word: string): string[] {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const out: string[] = [];

  for (const rule of SUFFIX_RULES) {
    if (!trimmed.endsWith(rule.suffix)) continue;
    if (trimmed.length <= rule.suffix.length) continue;
    const stem = trimmed.slice(0, -rule.suffix.length);
    // 「고」만 남은 조사/접속은 피한다 (너무 짧은 stem)
    if (rule.suffix === "고" && stem.length < 1) continue;
    out.push(...rule.toCandidate(stem));
  }

  out.push(...candidatesFromContractedPast(trimmed));

  return unique(out.filter((c) => c !== trimmed));
}

export class LemmaEngine {
  constructor(private readonly cache: CacheManager = sharedCacheManager) {}

  /**
   * 공통 기본형 분석 (Dictionary · 향후 Engine 공용).
   * 표제어 인덱스 없이 형태 규칙만으로 추정한다.
   * 실패 시 원문을 그대로 반환한다.
   */
  analyze(rawWord: string): string {
    const word = rawWord.trim();
    if (!word) return "";

    const cached = this.cache.get<string>(CACHE_NS.lemma, word);
    if (cached !== undefined) return cached;

    const candidates = generateLemmaCandidates(word);
    // 첫 후보를 기본형으로 사용. 없으면 원문 유지.
    const resolved = candidates[0] ?? word;

    this.cache.set(CACHE_NS.lemma, word, resolved);
    return resolved;
  }

  /**
   * 유의어 인덱스 우선 기본형 선택 (Synonym Engine 용).
   * 1) 원문이 인덱스에 있으면 원문
   * 2) 후보 중 인덱스에 있는 첫 항목
   * 3) analyze() 결과 (형태 추정 / 원문)
   */
  resolve(
    rawWord: string,
    headwords: ReadonlySet<string> | ReadonlyMap<string, unknown>,
  ): string {
    const word = rawWord.trim();
    if (!word) return "";

    const has = (key: string) =>
      headwords instanceof Map ? headwords.has(key) : headwords.has(key);

    if (has(word)) {
      // 원문이 이미 표제어면 캐시에도 남겨 재분석을 피한다.
      this.cache.set(CACHE_NS.lemma, word, word);
      return word;
    }

    const candidates = generateLemmaCandidates(word);
    const hit = candidates.find((c) => has(c));
    if (hit) {
      this.cache.set(CACHE_NS.lemma, word, hit);
      return hit;
    }

    return this.analyze(word);
  }

  clearCache(): void {
    this.cache.clearNamespace(CACHE_NS.lemma);
  }
}

/** 기본 싱글톤 — Core 가 주입·교체할 수 있다. */
export const lemmaEngine = new LemmaEngine();
