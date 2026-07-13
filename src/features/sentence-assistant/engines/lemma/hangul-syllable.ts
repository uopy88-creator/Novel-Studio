/**
 * =============================================================================
 * Hangul 음절 분해/결합 (활용형 → 기본형 추정용)
 * -----------------------------------------------------------------------------
 * Lemma Engine 전용. 유니코드 한글 음절(AC00–D7A3)만 처리한다.
 * =============================================================================
 */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
] as const;

const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

export interface HangulParts {
  cho: number;
  jung: number;
  jong: number;
  jungChar: string;
  jongChar: string;
}

export function isHangulSyllable(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return code >= HANGUL_BASE && code <= HANGUL_END;
}

export function decomposeHangul(char: string): HangulParts | null {
  if (!isHangulSyllable(char)) return null;
  const offset = char.charCodeAt(0) - HANGUL_BASE;
  const cho = Math.floor(offset / (JUNG_COUNT * JONG_COUNT));
  const jung = Math.floor(
    (offset % (JUNG_COUNT * JONG_COUNT)) / JONG_COUNT,
  );
  const jong = offset % JONG_COUNT;
  return {
    cho,
    jung,
    jong,
    jungChar: JUNGSEONG[jung],
    jongChar: JONGSEONG[jong],
  };
}

export function composeHangul(
  cho: number,
  jung: number,
  jong = 0,
): string {
  const code =
    HANGUL_BASE + (cho * JUNG_COUNT + jung) * JONG_COUNT + jong;
  return String.fromCharCode(code);
}

export function jungIndex(jungChar: string): number {
  return JUNGSEONG.indexOf(jungChar as (typeof JUNGSEONG)[number]);
}
