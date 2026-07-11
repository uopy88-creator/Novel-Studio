/**
 * =============================================================================
 * ManuscriptVersion — 명시적 원고 스냅샷
 * -----------------------------------------------------------------------------
 * 자동 저장(Manuscript)과 별개. 사용자가 "현재 버전 저장"할 때만 생성된다.
 * =============================================================================
 */

import type {
  ChapterId,
  ISODateTime,
  ManuscriptId,
  ProjectId,
  Timestamps,
} from "@/types/ids";

export type ManuscriptVersionId = string;

export interface ManuscriptVersion extends Timestamps {
  id: ManuscriptVersionId;
  projectId: ProjectId;
  /** Document (= Chapter) id */
  chapterId: ChapterId;
  manuscriptId: ManuscriptId;
  /** Document 내 순번 (1, 2, 3 …) */
  versionNumber: number;
  /**
   * 사용자 지정 이름.
   * 비어 있으면 UI에서 "Version {versionNumber}" 로 표시한다.
   * 예) 초고 완료, 1차 퇴고, 최종본
   */
  name: string;
  content: string;
  plainText: string;
  wordCount: number;
}

/** 목록·헤더에 쓸 표시 이름 */
export function displayVersionName(version: ManuscriptVersion): string {
  const trimmed = version.name.trim();
  return trimmed || `Version ${version.versionNumber}`;
}

export type { ISODateTime };
