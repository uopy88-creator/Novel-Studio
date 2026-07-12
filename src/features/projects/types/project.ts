/**
 * =============================================================================
 * Project (작품)
 * -----------------------------------------------------------------------------
 * Novel Studio의 루트 데이터.
 *
 * 왜 Project가 루트인가?
 * - 이 앱은 "소설을 쓰는 프로그램"이 아니라 "작품별 작업실"이다.
 * - 사용자는 작품 A / 작품 B를 오가며 작업한다.
 * - Chapter, Character, Memo 등은 모두 "어느 작품의 것인가"에 종속된다.
 *
 * 여기에 넣지 않는 것
 * - 챕터 본문, 캐릭터 목록 등 → 별도 엔티티
 * - 앱 전역 테마 → 나중에 UserSettings로 분리 (작품 설정과 혼동 방지)
 * =============================================================================
 */

import type { ProjectId, Timestamps } from "@/types/ids";

/**
 * 작품의 집필 단계.
 * 세계관 완성도보다 "글을 쓰는 상태"를 표현한다.
 */
export type ProjectStatus =
  | "ideation" // 구상 중 — 아직 본격 집필 전
  | "drafting" // 초고 집필 중
  | "revising" // 개정·퇴고 중
  | "completed" // 일단 완료
  | "archived"; // 보관 (목록에서 숨기거나 뒤로)

/**
 * 작품 종류.
 * Chapter가 아니라 Project의 속성이다.
 */
export type ProjectType = "novel" | "poem" | "essay" | "other";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  novel: "소설",
  poem: "시",
  essay: "에세이",
  other: "기타",
};

export const PROJECT_TYPE_OPTIONS: ProjectType[] = [
  "novel",
  "poem",
  "essay",
  "other",
];

export const DEFAULT_PROJECT_TYPE: ProjectType = "novel";

export function isProjectType(value: unknown): value is ProjectType {
  return (
    typeof value === "string" &&
    (PROJECT_TYPE_OPTIONS as string[]).includes(value)
  );
}

/**
 * 작품(프로젝트) 엔티티.
 *
 * 관계
 * - Project 1 ── * Chapter
 * - Project 1 ── * Character
 * - Project 1 ── * Dialogue
 * - Project 1 ── * Foreshadowing
 * - Project 1 ── * Memo
 * - Project 1 ── 1 ProjectSettings
 * - Project 1 ── * WritingSession
 */
export interface Project extends Timestamps {
  id: ProjectId;

  /** 작품 제목 (목록·헤더에 표시) */
  title: string;

  /**
   * 한 줄 로그라인/소개.
   * 긴 시놉시스는 Memo나 별도 문서로 두고, 여기서는 짧게 유지한다.
   */
  premise?: string;

  /** 작품 종류 (소설 / 시 / 에세이 / 기타) */
  type: ProjectType;

  /** 집필 단계 */
  status: ProjectStatus;

  /**
   * 목표 원고량(단어 수). 선택.
   * Writing Statistics의 진행률 계산에 쓰일 수 있다.
   */
  targetWordCount?: number;

  /**
   * 목록 정렬용. 작을수록 앞에 온다고 가정.
   * (드래그 정렬을 나중에 붙여도 id 체계를 바꿀 필요가 없다.)
   */
  sortOrder: number;
}
