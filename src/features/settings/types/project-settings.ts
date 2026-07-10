/**
 * =============================================================================
 * Settings (작품 설정)
 * -----------------------------------------------------------------------------
 * Project와 1:1.
 *
 * 왜 Project 안에 필드로 넣지 않나?
 * - Project는 "작품이 무엇인가" (제목, 상태)
 * - Settings는 "어떻게 쓰는가" (일일 목표, 에디터 선호)
 * - 나중에 설정 항목이 늘어나도 Project 목록 조회가 비대해지지 않는다.
 *
 * 앱 전역 설정(계정, 테마)은 여기에 넣지 않는다.
 * 필요해지면 UserSettings를 따로 만든다.
 * =============================================================================
 */

import type { ProjectId, Timestamps } from "@/types/ids";

/**
 * 단어 수 계산 방식.
 * 언어/에디터에 따라 달라질 수 있어 작품별로 고르게 둔다.
 */
export type WordCountMode =
  | "words" // 공백 기준 단어 (영문 등)
  | "characters" // 공백 제외 글자
  | "characters_with_spaces"; // 공백 포함 글자

/**
 * 작품별 집필 설정.
 *
 * 관계
 * - Project 1 ── 1 ProjectSettings  (projectId가 곧 조인 키)
 */
export interface ProjectSettings extends Timestamps {
  /** Project.id 와 동일 (1:1) */
  projectId: ProjectId;

  /** 하루 목표 분량 (WordCountMode 단위) */
  dailyWordGoal: number;

  /** 이 작품에서 쓰는 분량 계산 방식 */
  wordCountMode: WordCountMode;

  /**
   * 주간 집필 요일 (0=일 … 6=토).
   * 통계의 "목표 달성일" 계산에 사용.
   */
  writingDays: number[];

  /** 에디터에서 맞춤법/충돌 검사 등을 기본으로 켤지 */
  enableConflictCheckerByDefault: boolean;

  /**
   * 원고 자동 저장 간격(초).
   * UI/인프라에서 사용. 지금은 값의 의미만 정의.
   */
  autosaveIntervalSeconds: number;
}
