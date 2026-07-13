/**
 * =============================================================================
 * Engine 공통 계약
 * -----------------------------------------------------------------------------
 * 새 기능(Grammar / Style / ReadingTime …)은 이 인터페이스를 구현한 뒤
 * Core.registerEngine 으로 등록한다.
 * =============================================================================
 */

/** Engine 식별자 */
export type EngineId =
  | "lemma"
  | "dictionary"
  | "synonym"
  | "showTell"
  | (string & {});

export interface SentenceAssistantEngine {
  /** 고유 ID (등록·조회용) */
  readonly id: EngineId;
}
