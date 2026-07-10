/**
 * =============================================================================
 * Manuscript (원고 본문)
 * -----------------------------------------------------------------------------
 * "실제로 쓰는 글" 그 자체.
 *
 * Novel Studio가 세계관보다 집필을 중시한다는 점이 여기서 드러난다.
 * 설정 노트보다 Manuscript가 더 자주 읽고 쓰이는 데이터다.
 *
 * 설계 선택
 * - Chapter : Manuscript = 1 : 1
 *   → 한 장에 본문 문서가 하나. (분할 원고/버전이 필요해지면 나중에 Revision 추가)
 * - content는 우선 string.
 *   → 지금은 서식 엔진을 정하지 않는다. 나중에 Rich Text JSON으로 확장 가능.
 * =============================================================================
 */

import type {
  ChapterId,
  ISODateTime,
  ManuscriptId,
  ProjectId,
  Timestamps,
} from "@/types/ids";

/**
 * 원고 본문 엔티티.
 *
 * 관계
 * - Project 1 ── * Manuscript
 * - Chapter 1 ── 1 Manuscript  (chapterId는 작품 안에서 유일해야 한다)
 */
export interface Manuscript extends Timestamps {
  id: ManuscriptId;

  /** 소속 작품 (조회·권한 검사를 단순화하기 위해 중복 보관) */
  projectId: ProjectId;

  /** 이 본문이 속한 챕터 (1:1) */
  chapterId: ChapterId;

  /**
   * 본문.
   * - 초기: plain text
   * - 이후: 에디터 포맷에 맞는 직렬화 문자열/JSON 문자열 가능
   */
  content: string;

  /**
   * 통계·검색용 순수 텍스트.
   * content가 리치 포맷이 되어도 단어 수는 이 필드 기준으로 계산할 수 있다.
   * (plain text만 쓸 때는 content와 같아도 된다.)
   */
  plainText: string;

  /** 현재 단어 수 (저장 시 계산한다고 가정) */
  wordCount: number;

  /**
   * 사용자가 이 장을 마지막으로 편집한 시각.
   * updatedAt(내용 수정)과 분리 → "읽기만 해도" 최근 작업으로 표시 가능.
   */
  lastOpenedAt?: ISODateTime;
}
