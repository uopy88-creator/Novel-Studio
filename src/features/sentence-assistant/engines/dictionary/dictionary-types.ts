/**
 * =============================================================================
 * Dictionary — 타입
 * -----------------------------------------------------------------------------
 * Sentence Assistant 「단어 뜻」은 국립국어원 표준국어대사전만 사용한다 (AI 없음).
 * =============================================================================
 */

export interface DictionaryEntry {
  query: string;
  word: string;
  pos: string | null;
  definition: string;
  link: string | null;
}

export type DictionaryLookupStatus = "found" | "not_found" | "error";

export interface DictionaryLookupResult {
  status: DictionaryLookupStatus;
  entry?: DictionaryEntry;
  query: string;
}

export const DICTIONARY_NOT_FOUND_MESSAGE =
  "사전에 등록되지 않은 단어입니다.";

export const DICTIONARY_ERROR_MESSAGE =
  "사전 정보를 불러올 수 없습니다.";
