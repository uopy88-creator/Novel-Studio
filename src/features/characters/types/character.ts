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
 *
 * 프로필 본문은 `content` 자유 텍스트 에디터로 관리한다.
 * role/age/… 레거시 필드는 content에서 동기화해 목록·멘션 호환을 유지한다.
 */
export interface Character extends Timestamps {
  id: CharacterId;
  projectId: ProjectId;

  /** 이름 (필수) — content의 `이름 :` 과 동기화, @멘션 키 */
  name: string;

  /**
   * 자유 형식 프로필 본문.
   * 새 캐릭터는 CHARACTER_CONTENT_TEMPLATE 로 시작한다.
   */
  content: string;

  /** @deprecated content의 `별명 :` 동기화값 — 목록 부제 호환 */
  role: string;

  /** @deprecated content의 `나이 :` 동기화값 */
  age: string;

  /** @deprecated content의 `성별 :` 동기화값 (있을 때만) */
  gender: string;

  /** @deprecated content의 `직업 :` 동기화값 */
  occupation: string;

  /** @deprecated content의 `성격 :` 동기화값 */
  personality: string;

  /** @deprecated content의 `목표 :` 동기화값 */
  goal: string;

  /** @deprecated content의 `비밀 :` 동기화값 */
  secret: string;

  /** @deprecated content의 `메모 :` 동기화값 */
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
