/**
 * =============================================================================
 * Timeline Event (사건)
 * -----------------------------------------------------------------------------
 * 연표(달력)가 아니라, 작품 속 사건을 시간순으로 정리하는 목록이다.
 *
 * Architecture: Project → Manuscript → Sections
 * Timeline 은 Section 에만 연결한다. (구 Chapter UI/데이터는 사용하지 않음)
 *
 * DB 컬럼명 scene_stable_id 는 하위 호환을 위해 유지하며,
 * 도메인 필드명은 sectionStableId 를 쓴다.
 * =============================================================================
 */

import type {
  CharacterId,
  DocumentId,
  ProjectId,
  TimelineEventId,
  Timestamps,
} from "@/types/ids";

/**
 * Timeline 한 줄(사건).
 *
 * 관계
 * - Project 1 ── * TimelineEvent
 * - Manuscript Document? + sectionStableId? → Section / Manuscript 점프
 * - Character? → 인물 카드
 */
export interface TimelineEvent extends Timestamps {
  id: TimelineEventId;
  projectId: ProjectId;

  /** 사건 제목 */
  title: string;

  /** 짧은 설명 */
  description: string;

  /**
   * 목록 순서 (작을수록 위 = 더 이른 사건).
   * 드래그 앤 드롭으로만 바꾸고, 사용자는 번호를 직접 입력하지 않는다.
   * (Section Manuscript 순서와는 별개 — 이야기 시간순)
   */
  sortOrder: number;

  /**
   * 관련 Manuscript Document ID (숨은 컨테이너).
   * UI 에 Chapter/Document 이름으로 노출하지 않는다.
   */
  documentId?: DocumentId;

  /**
   * 관련 Section 안정 ID — section_001 (레거시 scene_001 도 허용).
   * DB 컬럼: scene_stable_id
   */
  sectionStableId?: string;

  /** 관련 Character */
  characterId?: CharacterId;
}
