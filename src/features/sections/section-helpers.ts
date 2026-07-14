/**
 * =============================================================================
 * Section Registry Helpers — 권장 공개 API (SSOT facade)
 * -----------------------------------------------------------------------------
 * 모든 기능은 Section 목록·조회·라벨을 여기서만 가져온다.
 * LocalStorage / DB / parseSections 로 목록을 만들지 말 것.
 *
 * 공개 이름: sectionId (= SectionRef.id)
 * 저장 계층의 sectionStableId / scene_stable_id 는 mapper 가 흡수한다.
 * =============================================================================
 */

import type { DocumentId, ProjectId } from "@/types/ids";
import {
  getSectionRegistrySnapshot,
  type SectionRef,
  type SectionRegistrySnapshot,
} from "@/features/sections/section-registry";
import {
  findSectionRefById,
  findSectionStableIdAtOffset,
  resolveSectionLabel,
} from "@/features/sections/resolve-section";
import {
  sectionOptionsFromRefs,
  type SectionOption,
} from "@/features/sections/section-options";

/** AI · 교차 기능용 읽기 전용 컨텍스트 */
export interface ProjectSectionContext {
  projectId: ProjectId;
  primaryDocumentId: DocumentId | null;
  sections: SectionRef[];
  ready: boolean;
  generation: number;
}

/** Registry 스냅샷 (구독 없이 읽기) */
export function getSectionRegistry(
  projectId: ProjectId,
): SectionRegistrySnapshot {
  return getSectionRegistrySnapshot(projectId);
}

/** sectionId(= SectionRef.id) 로 한 Section 조회 */
export function getSection(
  projectId: ProjectId,
  sectionId: string | null | undefined,
): SectionRef | null {
  return findSectionRefById(projectId, sectionId);
}

/** Project 의 Section 목록 (SSOT) */
export function listSections(projectId: ProjectId): SectionRef[] {
  return getSectionRegistrySnapshot(projectId).sections;
}

/** select/UI 용 옵션 — Registry 만 사용 */
export function listSectionOptions(projectId: ProjectId): SectionOption[] {
  const snap = getSectionRegistrySnapshot(projectId);
  return sectionOptionsFromRefs(snap.sections, snap.primaryDocumentId);
}

/** 딥링크용 primary Manuscript Document ID (목록 소스 아님) */
export function getPrimaryDocumentId(
  projectId: ProjectId,
): DocumentId | null {
  return getSectionRegistrySnapshot(projectId).primaryDocumentId;
}

/**
 * 원고 오프셋 → sectionId.
 * 목록 생성이 아니라 위치 해석 전용 (Manuscript content 파싱).
 */
export function findSectionIdAtOffset(
  content: string,
  offset: number,
): string | null {
  return findSectionStableIdAtOffset(content, offset);
}

/** @deprecated findSectionIdAtOffset 사용 */
export const findSectionStableIdAtOffsetAlias = findSectionIdAtOffset;

/**
 * AI / 향후 기능용 — Project 의 Section 맥락을 한 번에 읽는다.
 * 객체 복제 저장 금지: 호출 시점에 Registry 를 읽는다.
 */
export function getProjectSectionContext(
  projectId: ProjectId,
): ProjectSectionContext {
  const snap = getSectionRegistrySnapshot(projectId);
  return {
    projectId: snap.projectId,
    primaryDocumentId: snap.primaryDocumentId,
    sections: snap.sections,
    ready: snap.ready,
    generation: snap.generation,
  };
}

export {
  resolveSectionLabel,
  findSectionRefById,
  findSectionStableIdAtOffset,
};
