/**
 * =============================================================================
 * 집필 분량 통계 계산
 * -----------------------------------------------------------------------------
 * Dashboard / Manuscript가 공유한다.
 *
 * 규칙
 * - 원고지: 200자(공백 제외) = 1매 → 반올림
 * - 예상 소설책 페이지: 총 글자수(공백 포함) ÷ 700 → 소수점 첫째 자리
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
 */
export function estimateManuscriptSheets(charsWithoutSpaces: number): number {
  if (charsWithoutSpaces <= 0) return 0;
  return Math.round(charsWithoutSpaces / 200);
}

/**
 * 예상 소설책 페이지.
 * 총 글자수(공백 포함) ÷ 700, 소수점 첫째 자리까지 반올림.
 *
 * 예) 683 → 1.0, 1432 → 2.0, 3560 → 5.1
 */
export function estimateBookPages(totalChars: number): number {
  if (totalChars <= 0) return 0;
  return Math.round((totalChars / 700) * 10) / 10;
}

/** 천 단위 구분 표시 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

/** 소설책 페이지 — 항상 소수점 첫째 자리 */
export function formatBookPages(pages: number): string {
  return pages.toFixed(1);
}
