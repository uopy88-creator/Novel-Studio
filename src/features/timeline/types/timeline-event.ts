/**
 * =============================================================================
 * Timeline Event (사건)
 * -----------------------------------------------------------------------------
 * 연표(달력)가 아니라, 작품 속 사건을 시간순으로 정리하는 목록이다.
 * Scene Navigator · Character 와 선택적으로 연결한다.
 * =============================================================================
 */

import type {
  CharacterId,
  ChapterId,
  ProjectId,
  TimelineEventId,
  Timestamps,
} from "@/types/ids";

/**
 * Timeline 한 줄(사건).
 *
 * 관계
 * - Project 1 ── * TimelineEvent
 * - Document? + sceneStableId? → Scene Navigator 점프
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
   */
  sortOrder: number;

  /** 관련 Document (Scene이 속한 원고) */
  documentId?: ChapterId;

  /** 관련 Scene 안정 ID — 예: scene_001 (Scene Navigator 연동) */
  sceneStableId?: string;

  /** 관련 Character */
  characterId?: CharacterId;
}
