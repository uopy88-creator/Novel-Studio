/**
 * =============================================================================
 * Context Help — 타입
 * -----------------------------------------------------------------------------
 * 페이지별 도움말은 topics/*.ts 에만 둔다.
 * 새 기능 = 파일 하나 추가 + registry 등록.
 * =============================================================================
 */

/** 토픽 id — 파일명과 맞춘다 */
export type ContextHelpTopicId =
  | "dashboard"
  | "project"
  | "manuscript"
  | "character"
  | "vault"
  | "memo"
  | "foreshadowing"
  | "settings"
  | "export";

/** 관련 기능 링크 */
export interface ContextHelpRelatedLink {
  label: string;
  /**
   * 작품 작업실 세그먼트 (studioPath 사용).
   * 예: "manuscript" → /projects/:id/manuscript
   */
  segment?: string;
  /** 절대/상대 경로 (Projects 목록 등) */
  href?: string;
}

export interface ContextHelpFaq {
  question: string;
  answer: string;
}

/** 한 페이지의 Context Help 본문 */
export interface ContextHelpContent {
  id: ContextHelpTopicId;
  /** 패널 제목 — 예: Characters 사용법 */
  title: string;
  /** 1. 기능 설명 */
  description: string[];
  /** 2. 사용 순서 */
  steps?: string[];
  /** 3. TIP */
  tips?: string[];
  /** 4. 자주 하는 질문 */
  faqs?: ContextHelpFaq[];
  /** 5. 관련 기능 */
  related?: ContextHelpRelatedLink[];
}
