/**
 * =============================================================================
 * Sentence Analysis Result — Sentence Engine 공통 반환형
 * -----------------------------------------------------------------------------
 * 뜻 보기 · 유의어 · Show/Tell · 향후 기능이 모두 이 구조를 사용한다.
 * =============================================================================
 */

/** 추정 품사 — 규칙 기반. 사전 API 결과가 있으면 Core 가 보강할 수 있다. */
export type SentencePos =
  | "동사"
  | "형용사"
  | "명사"
  | "부사"
  | "기타";

/**
 * Sentence Engine 분석 결과 (모든 SA 기능의 SSOT).
 */
export interface SentenceAnalysisResult {
  /** 작가가 선택한 원문 (정규화 전 trim 만) */
  original: string;
  /** 기본형 (lemma) */
  lemma: string;
  /** 정규화된 표면형 (따옴표 제거·공백 정리) */
  normalized: string;
  /** 추정 품사 */
  pos: SentencePos;
}
