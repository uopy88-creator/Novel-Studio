/**
 * =============================================================================
 * Dashboard 통계 계산
 * -----------------------------------------------------------------------------
 * 보기 전용. LocalStorage에서 읽은 텍스트를 집계한다.
 *
 * 규칙 (제품 요구)
 * - 원고지: 200자(공백 제외) = 1매 → 반올림
 * - 예상 책 페이지: 250자(공백 제외) = 1페이지 → 반올림
 * =============================================================================
 */

/** 공백(스페이스, 탭, 개행 등)을 모두 제거한 글자 수 */
export function countCharsWithoutSpaces(text: string): number {
  return text.replace(/\s/g, "").length;
}

/** 총 글자수 (공백 포함) */
export function countCharsWithSpaces(text: string): number {
  return text.length;
}

/**
 * 예상 원고지 매수.
 * 200자(공백 제외) = 1매, 반올림.
 * 글자가 0이면 0.
 */
export function estimateManuscriptSheets(charsWithoutSpaces: number): number {
  if (charsWithoutSpaces <= 0) return 0;
  return Math.round(charsWithoutSpaces / 200);
}

/**
 * 예상 책 페이지.
 * 250자(공백 제외) = 1페이지, 반올림.
 */
export function estimateBookPages(charsWithoutSpaces: number): number {
  if (charsWithoutSpaces <= 0) return 0;
  return Math.round(charsWithoutSpaces / 250);
}

/** 천 단위 구분 표시 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}
