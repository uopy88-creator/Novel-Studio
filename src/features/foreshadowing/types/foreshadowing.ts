/**
 * =============================================================================
 * Foreshadowing (복선)
 * -----------------------------------------------------------------------------
 * "심어 둔 것"과 "회수할 것"을 추적한다.
 *
 * 왜 집필 중심 기능인가?
 * - 세계관 설정 나열이 아니라, 원고를 쓰는 동안 놓치기 쉬운 약속을 관리한다.
 * - plantedChapterId / payoffChapterId 로 챕터와 연결한다.
 *
 * 상태 머신 (단순)
 * planned → planted → paid_off
 *                ↘ dropped (쓰지 않기로 함)
 * =============================================================================
 */

import type {
  ChapterId,
  CharacterId,
  ForeshadowingId,
  ProjectId,
  Timestamps,
} from "@/types/ids";

/**
 * 복선의 생명주기.
 */
export type ForeshadowingStatus =
  | "planned" // 아직 원고에 안 넣음
  | "planted" // 심음 (회수 대기)
  | "paid_off" // 회수 완료
  | "dropped"; // 폐기

/**
 * 복선 엔티티.
 *
 * 관계
 * - Project 1 ── * Foreshadowing
 * - Chapter? ← plantedChapterId (심은 장)
 * - Chapter? ← payoffChapterId  (회수한 장)
 * - Character[] ← relatedCharacterIds (관련 인물, 선택)
 */
export interface Foreshadowing extends Timestamps {
  id: ForeshadowingId;

  projectId: ProjectId;

  /** 복선 제목 (목록용 짧은 이름) */
  title: string;

  /** 무엇을 심었는지 / 어떻게 회수할지 설명 */
  description?: string;

  status: ForeshadowingStatus;

  /** 복선을 심은(또는 심을) 챕터 */
  plantedChapterId?: ChapterId;

  /** 복선을 회수한(또는 회수할) 챕터 */
  payoffChapterId?: ChapterId;

  /** 관련된 인물들 (없으면 빈 배열) */
  relatedCharacterIds: CharacterId[];

  /**
   * 중요도 1~5.
   * UI에서 정렬·강조에 사용. 강제 규칙은 없다.
   */
  importance: 1 | 2 | 3 | 4 | 5;
}
