/**
 * =============================================================================
 * Character (인물 프로필)
 * -----------------------------------------------------------------------------
 * 작가가 집필 중 계속 참고하는 인물 카드.
 * =============================================================================
 */

import type { CharacterId, ProjectId, Timestamps } from "@/types/ids";

/**
 * 역할 프리셋 (자유 입력도 허용 — role 필드는 string).
 */
export type CharacterRolePreset =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "minor"
  | "other";

/** @deprecated CharacterRolePreset 사용. 하위 호환. */
export type CharacterRole = CharacterRolePreset;

export const CHARACTER_ROLE_LABELS: Record<CharacterRolePreset, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  minor: "단역",
  other: "기타",
};

export const CHARACTER_ROLE_PRESETS: CharacterRolePreset[] = [
  "protagonist",
  "antagonist",
  "supporting",
  "minor",
  "other",
];

/** 기본 대표 색상 */
export const DEFAULT_CHARACTER_COLOR = "#2563eb";

/**
 * 인물 프로필 엔티티.
 *
 * 관계
 * - Project 1 ── * Character
 * - Manuscript @멘션으로 이름을 참조
 */
export interface Character extends Timestamps {
  id: CharacterId;
  projectId: ProjectId;

  /** 이름 (필수) */
  name: string;

  /** 별명 */
  nickname: string;

  /** 현재 상태 */
  status: string;

  /** 한 줄 소개 */
  intro: string;

  /** 역할 (주인공/조연 등 — 자유 텍스트) */
  role: string;

  /** 나이 */
  age: string;

  /** 성별 */
  gender: string;

  /** 직업 */
  occupation: string;

  /** 성격 */
  personality: string;

  /** 목표 */
  goal: string;

  /** 비밀 */
  secret: string;

  /** 메모 */
  memo: string;

  /**
   * 프로필 이미지.
   * data URL 또는 빈 문자열.
   */
  image: string;

  /** 대표 색상 (hex, 예: #2563eb) */
  color: string;

  /** 즐겨찾기 — 목록 상단 고정 */
  isFavorite: boolean;

  /** 목록 정렬용 (작을수록 앞) */
  sortOrder: number;
}
