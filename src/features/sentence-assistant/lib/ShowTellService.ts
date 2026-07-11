/**
 * =============================================================================
 * ShowTellService
 * -----------------------------------------------------------------------------
 * Show / Tell 탭 전용. Dictionary · Expression 과 분리한다.
 * 문장을 분석하고, 참고용 예시 1개만 반환한다.
 * =============================================================================
 */

import {
  THEME_KEYWORDS,
  TO_SHOW_EXAMPLES,
  TO_TELL_EXAMPLES,
  type ShowTellThemeId,
} from "@/features/sentence-assistant/lib/show-tell-data";
import type {
  ShowTellAnalysis,
  ShowTellExampleResult,
  ShowTellKind,
  ShowTellStyleId,
} from "@/features/sentence-assistant/lib/show-tell-types";

/** Tell(감정·상태 직접 서술) 신호가 강한 표현 */
const TELL_PATTERNS: RegExp[] = [
  /슬프[다다고네]/,
  /기쁘[다다고네]/,
  /화나[다다고네]/,
  /분노하[다다고네]/,
  /우울하[다다고네]/,
  /행복하[다다고네]/,
  /무섭[다다고네]/,
  /두렵[다다고네]/,
  /외롭[다다고네]/,
  /걱정[이했하]/,
  /불안하[다다고네]/,
  /피곤하[다다고네]/,
  /좋아하[다다고네]/,
  /싫어하[다다고네]/,
  /사랑하[다다고네]/,
  /느꼈다/,
  /생각했다/,
  /알고 있었다/,
  /알고 있다/,
  /이었다\.$/,
  /였다\.$/,
];

/** Show(감각·행동·대사로 보여 주기) 신호가 강한 표현 */
const SHOW_PATTERNS: RegExp[] = [
  /[“”「」『』"']/,
  /바라보/,
  /쳐다보/,
  /악물/,
  /주먹을? 쥐/,
  /손이? /,
  /눈이? /,
  /입술/,
  /어깨/,
  /떨렸/,
  /떨리/,
  /소리만? /,
  /초침/,
  /햇살/,
  /바람/,
  /냄새/,
  /발소리/,
  /물러서/,
  /걸어가/,
  /문을? /,
];

function normalizeSentence(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function detectTheme(sentence: string): ShowTellThemeId {
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [
    Exclude<ShowTellThemeId, "generic">,
    string[],
  ][]) {
    if (keywords.some((kw) => sentence.includes(kw))) {
      return theme;
    }
  }
  return "generic";
}

function scorePatterns(sentence: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (score, pattern) => (pattern.test(sentence) ? score + 1 : score),
    0,
  );
}

/**
 * 선택 문장이 Show 인지 Tell 인지 휴리스틱으로 판별한다.
 * 완벽한 문학 분석이 아니라, 작가가 참고할 수 있는 방향 신호다.
 */
export function analyzeSentence(raw: string): ShowTellAnalysis | null {
  const sentence = normalizeSentence(raw);
  if (!sentence) return null;

  const tellScore = scorePatterns(sentence, TELL_PATTERNS);
  const showScore = scorePatterns(sentence, SHOW_PATTERNS);

  // 짧은 감정 서술문은 Tell 쪽으로 기울인다.
  const shortTellBoost =
    sentence.length <= 20 && /[했였]다\.?$/.test(sentence) ? 1 : 0;

  const kind: ShowTellKind =
    showScore > tellScore + shortTellBoost ? "show" : "tell";

  return { sentence, kind };
}

/**
 * 반대 방식의 참고 예시 1개를 반환한다.
 * targetKind: 보여주고 싶은 방식 (Tell이면 Show 예시, Show이면 Tell 예시)
 */
export function getReferenceExample(
  sentence: string,
  targetKind: ShowTellKind,
  style: ShowTellStyleId,
): ShowTellExampleResult {
  const theme = detectTheme(normalizeSentence(sentence));
  const table = targetKind === "show" ? TO_SHOW_EXAMPLES : TO_TELL_EXAMPLES;
  const set = table[theme] ?? table.generic;

  return {
    style,
    example: set[style],
  };
}

export const ShowTellService = {
  analyze: analyzeSentence,
  analyzeSentence,
  getReferenceExample,
  detectTheme,
};
