/**
 * =============================================================================
 * Dictionary — 타입
 * -----------------------------------------------------------------------------
 * Sentence Assistant 「단어 뜻」은 국립국어원 표준국어대사전만 사용한다 (AI 없음).
 * 표시: 단어 · 품사 · 뜻풀이 · 출처 링크
 * =============================================================================
 */

/** API / 클라이언트 공통 — 성공 시 첫 번째 검색 결과 */
export interface DictionaryEntry {
  /** 검색에 사용한 정규화 쿼리 */
  query: string;
  /** 사전에 실린 표제어 */
  word: string;
  /** 품사 (없으면 null) */
  pos: string | null;
  /** 뜻풀이 */
  definition: string;
  /** 표준국어대사전 출처 링크 */
  link: string | null;
}

export type DictionaryLookupStatus = "found" | "not_found" | "error";

export interface DictionaryLookupResult {
  status: DictionaryLookupStatus;
  /** found 일 때만 채움 */
  entry?: DictionaryEntry;
  /** 정규화된 검색어 (실패 시에도 표시용) */
  query: string;
}

/** 사전에 항목이 없을 때 */
export const DICTIONARY_NOT_FOUND_MESSAGE =
  "사전에 등록되지 않은 단어입니다.";

/** 네트워크·인증·Rate Limit 등 API 실패 */
export const DICTIONARY_ERROR_MESSAGE =
  "사전 정보를 불러올 수 없습니다.";
