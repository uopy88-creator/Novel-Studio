/**
 * =============================================================================
 * Memo (메모)
 * -----------------------------------------------------------------------------
 * 가장 가벼운 기록 단위.
 *
 * 왜 필요한가?
 * - 집필 중 떠오른 생각을 Chapter 본문에 섞으면 나중에 찾기 어렵다.
 * - "어디에 붙일지 몰라도" 일단 적을 수 있어야 한다.
 *
 * 연결은 모두 optional
 * - chapterId / characterId / foreshadowingId 중 0개 이상
 * - 여러 곳에 동시에 연결할 수도 있다 (예: 특정 인물의 특정 장 메모)
 * =============================================================================
 */

import type {
  ChapterId,
  CharacterId,
  ForeshadowingId,
  MemoId,
  ProjectId,
  Timestamps,
} from "@/types/ids";

/**
 * 메모의 성격. 필터용 가벼운 분류.
 */
export type MemoKind =
  | "idea" // 아이디어
  | "todo" // 해야 할 일
  | "question" // 미결 질문
  | "note"; // 일반 노트

/**
 * 메모 엔티티.
 *
 * 관계
 * - Project 1 ── * Memo
 * - Chapter? / Character? / Foreshadowing? 에 선택적으로 연결
 */
export interface Memo extends Timestamps {
  id: MemoId;

  projectId: ProjectId;

  /** 메모 본문 (짧게 유지하는 것을 권장) */
  body: string;

  kind: MemoKind;

  /** 고정 — 목록 상단 */
  isPinned: boolean;

  /** 해결됨 (todo/question에 특히 유용) */
  isResolved: boolean;

  chapterId?: ChapterId;
  characterId?: CharacterId;
  foreshadowingId?: ForeshadowingId;

  tags: string[];
}
