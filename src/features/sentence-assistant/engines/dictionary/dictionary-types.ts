/**
 * =============================================================================
 * Dictionary — 타입
 * -----------------------------------------------------------------------------
 * Sentence Assistant 「단어 뜻」은 국립국어원 표준국어대사전만 사용한다 (AI 없음).
 * 검색어는 Sentence Engine 의 lemma 를 우선 사용한다.
 * 다의어는 최대 2개 sense 까지 표시한다.
 * =============================================================================
 */

/** 개별 의미(sense) */
export interface DictionarySense {
  definition: string;
  /** 품사 — 없으면 null (표시 생략) */
  pos: string | null;
}

export interface DictionaryEntry {
  query: string;
  word: string;
  /**
   * 첫 의미의 품사 (하위 호환).
   * 다의어 UI 는 senses[].pos 를 사용한다.
   */
  pos: string | null;
  /** 첫 의미 뜻풀이 (하위 호환) */
  definition: string;
  link: string | null;
  /**
   * 표시용 의미 목록 (API 순서, 중복 제거, 최대 2개).
   * 항상 1개 이상. 없으면 entry 자체가 null.
   */
  senses: DictionarySense[];
}

export type DictionaryLookupStatus = "found" | "not_found" | "error";

/** 실제 API 에 히트한 검색어 종류 */
export type DictionaryMatchedBy = "lemma" | "original";

export interface DictionaryLookupResult {
  status: DictionaryLookupStatus;
  entry?: DictionaryEntry;
  /**
   * 표시·재검색용 표제어.
   * 기본형 검색이 성공하면 lemma, 원문 폴백이면 원문(또는 API word).
   */
  query: string;
  /** Sentence Engine 기본형 (검색 1순위) */
  lemma?: string;
  /** 작가가 선택한 원문(정규화) */
  original?: string;
  /** 어떤 검색어로 뜻을 찾았는지 */
  matchedBy?: DictionaryMatchedBy;
}

export const DICTIONARY_NOT_FOUND_MESSAGE =
  "사전에 등록되지 않은 단어입니다.";

export const DICTIONARY_ERROR_MESSAGE = "뜻을 가져오지 못했습니다.";

/** Sentence Assistant 에 표시하는 최대 의미 수 */
export const DICTIONARY_MAX_SENSES = 2;
