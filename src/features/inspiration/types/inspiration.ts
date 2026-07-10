/**
 * =============================================================================
 * Inspiration (영감 노트)
 * -----------------------------------------------------------------------------
 * 원고에서 고른 문장과, 참고한 작품·메모를 연결한다.
 * 원고 본문은 바꾸지 않고, 위치만 기억해 💡 아이콘으로 표시한다.
 * =============================================================================
 */

import type {
  DocumentId,
  InspirationId,
  ISODateTime,
  ProjectId,
} from "@/types/ids";

export type { InspirationId };

/**
 * 영감 노트 엔티티.
 *
 * 관계
 * - Project 1 ── * Inspiration
 * - Document 1 ── * Inspiration
 */
export interface Inspiration {
  id: InspirationId;
  projectId: ProjectId;
  /** Document(Chapter) ID */
  documentId: DocumentId;

  /** 원고에서 선택한 문장/단어 */
  selectedText: string;

  /**
   * 참고한 작품 제목.
   * 소설·영화·기타 구분 없이 모두 "작품".
   * @example "채식주의자", "인터스텔라"
   */
  workTitle: string;

  /** 작가/감독 등 — 선택 */
  author: string;

  /** 무엇을 참고했는지 메모 */
  memo: string;

  /**
   * 원고 내 선택 시작 오프셋 (본문 변경 없이 💡 위치용).
   */
  startOffset: number;

  /** 원고 내 선택 끝 오프셋 */
  endOffset: number;

  createdAt: ISODateTime;
  /** 수정 시각 (수정 UI용) */
  updatedAt: ISODateTime;
}
