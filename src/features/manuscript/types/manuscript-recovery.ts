/**
 * =============================================================================
 * Manuscript Auto Recovery — 브라우저 로컬 임시 초안
 * -----------------------------------------------------------------------------
 * Supabase 자동 저장과 완전히 분리된다.
 * - 이 데이터는 LocalStorage 에만 존재한다.
 * - 클라우드 CRUD / WORK_DATA_BACKUP 에 포함하지 않는다.
 * - 브라우저 종료·탭 충돌 후 "복원하시겠습니까?" 용도로만 쓴다.
 * =============================================================================
 */

import type { ChapterId, ISODateTime, ProjectId } from "@/types/ids";

/** 문서당 하나의 복구 초안 */
export interface ManuscriptRecoveryDraft {
  projectId: ProjectId;
  chapterId: ChapterId;
  /** 임시 저장된 원고 본문 */
  content: string;
  /** 로컬에 기록된 시각 */
  updatedAt: ISODateTime;
}

/** 복원 팝업에 넘기는 비교 쌍 */
export interface RecoveryOffer {
  draft: ManuscriptRecoveryDraft;
  /** Document 로드 시점의 마지막 저장본 (Supabase/로컬 원고) */
  savedContent: string;
}
