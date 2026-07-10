/**
 * =============================================================================
 * Writing Statistics (집필 통계)
 * -----------------------------------------------------------------------------
 * 통계의 원천은 "집계 숫자"가 아니라 WritingSession(집필 세션)이다.
 *
 * 왜 세션을 먼저 두나?
 * - "오늘 2000자"만 저장하면 나중에 챕터별/시간대별 분석이 어렵다.
 * - 세션을 쌓고, WritingStatsDaily는 그 세션을 날짜별로 합친 뷰로 둔다.
 *
 * 집필 중심 제품답게, 세계관 편집 시간은 여기 넣지 않는다.
 * (원하면 나중에 activityType을 확장)
 * =============================================================================
 */

import type {
  ChapterId,
  ISODate,
  ISODateTime,
  ProjectId,
  Timestamps,
  WritingSessionId,
} from "@/types/ids";

/**
 * 한 번의 집필 구간.
 *
 * 예: 25분 동안 챕터 3을 열어 420단어를 씀.
 */
export interface WritingSession extends Timestamps {
  id: WritingSessionId;

  projectId: ProjectId;

  /** 어느 장을 썼는지 (작품 전체 메모만 쓴 날이면 생략 가능) */
  chapterId?: ChapterId;

  /** 세션 시작 */
  startedAt: ISODateTime;

  /** 세션 종료 (진행 중이면 생략 가능) */
  endedAt?: ISODateTime;

  /**
   * 이 세션에서 순증가한 단어 수.
   * 삭제가 더 많으면 음수도 허용한다 → 정직한 통계.
   */
  wordsDelta: number;

  /**
   * 실제 집필에 쓴 시간(초).
   * startedAt~endedAt과 다를 수 있다 (자리비움 제외 등).
   */
  durationSeconds: number;
}

/**
 * 날짜별 집계 스냅샷.
 *
 * WritingSession[] 을 매번 합쳐도 되지만,
 * 대시보드용으로 미리 계산해 둘 수 있는 형태를 타입으로 고정한다.
 * (지금은 타입만 — 집계 로직 없음)
 */
export interface WritingStatsDaily {
  projectId: ProjectId;

  /** 통계 날짜 (로컬 캘린더 기준이라고 가정) */
  date: ISODate;

  /** 그날 순증가 단어 합 */
  wordsDelta: number;

  /** 그날 집필 시간 합(초) */
  durationSeconds: number;

  /** 그날 세션 수 */
  sessionCount: number;
}

/**
 * 작품 단위로 한눈에 보는 요약 (UI용 뷰 모델에 가깝다).
 * DB에 꼭 저장할 필요는 없고, 세션/챕터에서 계산해도 된다.
 */
export interface WritingStatsSummary {
  projectId: ProjectId;

  /** 전 챕터 wordCount 합 등, 현재 총 원고량 */
  totalWordCount: number;

  /** Project.targetWordCount 대비 진행률 0~1 (목표 없으면 생략) */
  progressRatio?: number;

  /** 최근 N일 순증가 (예: 7일) */
  recentWordsDelta: number;

  /** 마지막 집필 시각 */
  lastWrittenAt?: ISODateTime;
}
