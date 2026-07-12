/**
 * =============================================================================
 * Expression Lemma Resolver — 활용형 → 기본형(lemma)
 * -----------------------------------------------------------------------------
 * AI/형태소 분석기 없이, 짧은 접미·음절 규칙으로 기본형을 추정한다.
 *
 * 흐름
 * 1) 원문 그대로 인덱스에 있으면 그대로 사용
 * 2) 규칙으로 후보 생성 → 인덱스에 있는 첫 후보
 * 3) 실패 시 원문 그대로 (재검색용)
 *
 * 같은 입력은 메모리 캐시로 반복 분석하지 않는다.
 * =============================================================================
 */

import {
  composeHangul,
  decomposeHangul,
  jungIndex,
} from "@/features/sentence-assistant/lib/hangul-syllable";

/** lemma 해석 결과 캐시 (프로세스/세션 동안) */
const lemmaCache = new Map<string, string>();

/** 종성 ㄷ 인덱스 (JONGSEONG) */
const JONG_DIGEUT = 7;

/**
 * 접미 규칙 (긴 것 우선).
 * 사용자 요구: 었다/았다/였다/한다/했다/는다/는다가/하고/하며
 */
const SUFFIX_RULES: ReadonlyArray<{
  suffix: string;
  toCandidate: (stem: string) => string[];
}> = [
  {
    suffix: "는다가",
    toCandidate: (stem) => [`${stem}다`],
  },
  {
    suffix: "는다고",
    toCandidate: (stem) => [`${stem}다`],
  },
  {
    suffix: "었다",
    toCandidate: (stem) => candidatesAfterEotPast(stem),
  },
  {
    suffix: "았다",
    toCandidate: (stem) => [`${stem}다`],
  },
  {
    suffix: "였다",
    toCandidate: (stem) => [`${stem}다`, `${stem}이다`],
  },
  {
    suffix: "했다",
    toCandidate: (stem) => (stem ? [`${stem}하다`] : ["하다"]),
  },
  {
    suffix: "한다",
    toCandidate: (stem) => (stem ? [`${stem}하다`] : ["하다"]),
  },
  {
    suffix: "는다",
    toCandidate: (stem) => [`${stem}다`],
  },
  {
    suffix: "하고",
    toCandidate: (stem) => [`${stem}하다`],
  },
  {
    suffix: "하며",
    toCandidate: (stem) => [`${stem}하다`],
  },
];

/** 걸었다 → 걸다 / 걷다(ㄷ불규칙) */
function candidatesAfterEotPast(stem: string): string[] {
  const out = [`${stem}다`];
  if (!stem) return out;

  const last = stem[stem.length - 1];
  const parts = decomposeHangul(last);
  // ㄷ 불규칙: 걷다 ↔ 걸었다 (받침 ㄹ → ㄷ)
  if (parts && parts.jongChar === "ㄹ") {
    const restored = composeHangul(parts.cho, parts.jung, JONG_DIGEUT);
    out.push(`${stem.slice(0, -1)}${restored}다`);
  }
  return unique(out);
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

/**
 * 계약형 과거: 슬펐다·봤다·커졌다 처럼
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

  // 1) ㅆ만 제거
  out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);

  // 2) ㅓ+ㅆ ← ㅡ다 (슬펐다 → 슬프다, 컸다 → 크다)
  if (parts.jungChar === "ㅓ") {
    const eu = jungIndex("ㅡ");
    if (eu >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, eu, 0)}다`);
    }
  }

  // 3) ㅏ+ㅆ ← ㅏ다 / ㅗ 축약 후보
  if (parts.jungChar === "ㅏ") {
    out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);
    const o = jungIndex("ㅗ");
    if (o >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, o, 0)}다`);
    }
  }

  // 4) ㅘ+ㅆ ← ㅗ다 (봤다 → 보다, 바라봤다 → 바라보다)
  if (parts.jungChar === "ㅘ") {
    const o = jungIndex("ㅗ");
    if (o >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, o, 0)}다`);
    }
  }

  // 5) ㅝ+ㅆ ← ㅜ다 (줬다 → 주다)
  if (parts.jungChar === "ㅝ") {
    const u = jungIndex("ㅜ");
    if (u >= 0) {
      out.push(`${prefix}${composeHangul(parts.cho, u, 0)}다`);
    }
  }

  // 6) ㅐ+ㅆ ← 하다 축약 등
  if (parts.jungChar === "ㅐ") {
    out.push(`${prefix}하다`);
    out.push(`${prefix}${composeHangul(parts.cho, parts.jung, 0)}다`);
  }

  return unique(out);
}

/**
 * 규칙 순서로 lemma 후보를 만든다 (인덱스 검사 전).
 */
export function generateLemmaCandidates(word: string): string[] {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const out: string[] = [];

  for (const rule of SUFFIX_RULES) {
    if (!trimmed.endsWith(rule.suffix)) continue;
    if (trimmed.length <= rule.suffix.length) continue;
    const stem = trimmed.slice(0, -rule.suffix.length);
    out.push(...rule.toCandidate(stem));
  }

  out.push(...candidatesFromContractedPast(trimmed));

  return unique(out.filter((c) => c !== trimmed));
}

/**
 * 유의어 인덱스를 기준으로 기본형을 고른다.
 */
export function resolveExpressionLemma(
  rawWord: string,
  headwords: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): string {
  const word = rawWord.trim();
  if (!word) return "";

  const cached = lemmaCache.get(word);
  if (cached !== undefined) return cached;

  const has = (key: string) =>
    headwords instanceof Map ? headwords.has(key) : headwords.has(key);

  let resolved = word;
  if (has(word)) {
    resolved = word;
  } else {
    const candidates = generateLemmaCandidates(word);
    const hit = candidates.find((c) => has(c));
    // 인덱스에 없어도 추정 후보가 있으면 그걸로 검색 (결과 없을 수 있음)
    // 추정 자체가 실패하면 원문 그대로 검색
    resolved = hit ?? candidates[0] ?? word;
  }

  lemmaCache.set(word, resolved);
  return resolved;
}

/** 테스트·개발용 캐시 초기화 */
export function clearExpressionLemmaCache(): void {
  lemmaCache.clear();
}
