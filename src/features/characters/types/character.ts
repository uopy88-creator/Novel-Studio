/**
 * =============================================================================
 * Character (인물)
 * -----------------------------------------------------------------------------
 * 집필 중 "바로 열어보는 인물 카드".
 *
 * 왜 두꺼운 세계관 시트를 만들지 않나?
 * - Novel Studio의 우선순위는 설정 백과보다 집필 흐름이다.
 * - 이름, 역할, 짧은 요약, 메모 정도면 초고 단계에서 충분하다.
 * - 깊은 설정이 필요하면 나중에 World Bible 기능으로 확장한다.
 *
 * Dialogue Vault / Foreshadowing이 characterId로 이 카드를 참조한다.
 * =============================================================================
 */

import type { CharacterId, ProjectId, Timestamps } from "@/types/ids";

/**
 * 이야기 안에서의 역할 힌트.
 * 강제 분류가 아니라, 목록 필터/색 구분용 가벼운 태그다.
 */
export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "minor"
  | "other";

/**
 * 인물 엔티티.
 *
 * 관계
 * - Project 1 ── * Character
 * - Dialogue.characterId → Character?  (선택)
 * - Foreshadowing.relatedCharacterIds → Character[]  (선택)
 * - Memo.characterId → Character?  (선택)
 */
export interface Character extends Timestamps {
  id: CharacterId;

  projectId: ProjectId;

  /** 표시 이름 */
  name: string;

  /** 이야기 역할 (선택) */
  role?: CharacterRole;

  /**
   * 한두 문장 요약.
   * 예: "기억을 잃은 채 도시로 들어온 탐정"
   */
  summary?: string;

  /** 집필 중 자유롭게 적는 노트 */
  notes?: string;

  /**
   * UI에서 인물을 구분하는 포인트 컬러 (hex 등).
   * 대사 금고·타임라인에서 빠르게 눈에 띄게 할 때 사용.
   */
  color?: string;

  /** 목록 정렬 */
  sortOrder: number;
}
