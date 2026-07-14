/**
 * =============================================================================
 * Trash — Soft Delete 공통 모델
 * -----------------------------------------------------------------------------
 * 모든 삭제는 Trash 로 이동한다. 물리 삭제는 permanentDelete 만.
 * =============================================================================
 */

import type { ISODateTime, ProjectId } from "@/types/ids";

/** 휴지통에 넣을 수 있는 엔티티 종류 */
export type TrashEntityType =
  | "project"
  | "document"
  | "character"
  | "timeline"
  | "foreshadowing"
  | "memo"
  | "writing-vault"
  | "word-treasury"
  | "inspiration";

export const TRASH_ENTITY_LABELS: Record<TrashEntityType, string> = {
  project: "Project",
  document: "Document",
  character: "Character",
  timeline: "Timeline",
  foreshadowing: "Foreshadowing",
  memo: "Memo",
  "writing-vault": "Writing Vault",
  "word-treasury": "Word Treasury",
  inspiration: "Inspiration",
};

/** 자동 영구삭제 예정일 계산용 (일) — 실행은 별도 작업 */
export const TRASH_RETENTION_DAYS = 30;

/** 휴지통 한 항목 */
export interface TrashItem {
  id: string;
  projectId: ProjectId;
  entityType: TrashEntityType;
  entityId: string;
  /** 목록에 표시할 이름 */
  name: string;
  deletedAt: ISODateTime;
  /** deletedAt + 30일 — 자동 삭제 구조용 */
  expiresAt: ISODateTime;
  /** 복원용 전체 스냅샷 */
  payload: unknown;
}

export function computeExpiresAt(deletedAt: ISODateTime): ISODateTime {
  const ms = Date.parse(deletedAt);
  if (!Number.isFinite(ms)) return deletedAt;
  return new Date(ms + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
