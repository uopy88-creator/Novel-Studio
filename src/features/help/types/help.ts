/**
 * =============================================================================
 * Help Center — 타입
 * -----------------------------------------------------------------------------
 * 문서 본문은 data/help-content.ts 에만 둔다.
 * UI는 이 모델을 렌더링할 뿐이며, 섹션 추가만으로 문서가 갱신된다.
 * =============================================================================
 */

export type HelpBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "shortcut"; keys: string; action: string }
  | { type: "faq"; question: string; answer: string };

/** 목차·본문 공통 섹션 (중첩 가능 → TOC 접기/펼치기) */
export interface HelpSection {
  id: string;
  title: string;
  /** 본문 블록 (없으면 그룹 헤더만) */
  blocks?: HelpBlock[];
  children?: HelpSection[];
}

export interface HelpDocument {
  title: string;
  subtitle: string;
  sections: HelpSection[];
}
