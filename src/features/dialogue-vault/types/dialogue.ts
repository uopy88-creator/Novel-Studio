/**
 * =============================================================================
 * Dialogue (대사 금고 — Dialogue Vault)
 * -----------------------------------------------------------------------------
 * 문득 떠오른 대사를 원고와 독립적으로 보관한다.
 *
 * 필수 필드 (제품 요구)
 * - id, projectId, content, tags, isFavorite
 *
 * Timestamps는 정렬·동기화를 위해 함께 둔다.
 * =============================================================================
 */

import type { DialogueId, ProjectId, Timestamps } from "@/types/ids";

/**
 * 대사 엔티티.
 *
 * 관계
 * - Project 1 ── * Dialogue
 * - 원고(Manuscript)와는 직접 연결하지 않는다 (독립 보관)
 */
export interface Dialogue extends Timestamps {
  id: DialogueId;

  projectId: ProjectId;

  /** 대사 본문 */
  content: string;

  /**
   * 자유 태그.
   * @example ["유머", "반전"]
   */
  tags: string[];

  /** 즐겨찾기 — 목록 상단에 고정 */
  isFavorite: boolean;
}
