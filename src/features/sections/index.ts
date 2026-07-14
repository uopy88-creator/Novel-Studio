/**
 * =============================================================================
 * sections feature — Project-wide Section Registry (SSOT)
 * -----------------------------------------------------------------------------
 * 권장 진입점 (신규 코드):
 *   getSectionRegistry / getSection / listSections / listSectionOptions
 *   getPrimaryDocumentId / resolveSectionLabel / findSectionIdAtOffset
 *   getProjectSectionContext / useSectionOptions / useSectionLabel
 *
 * Manuscript 만 publishSections 로 목록을 발행한다.
 * 다른 기능은 위 Helper·훅으로만 읽는다.
 * =============================================================================
 */

export type {
  SectionRef,
  SectionRegistrySnapshot,
  SectionRegistrySource,
} from "./section-registry";
export {
  formatSectionRefLabel,
  getSectionRegistrySnapshot,
  publishSections,
  resetSectionRegistry,
  subscribeSectionRegistry,
} from "./section-registry";

export type { ProjectSectionContext } from "./section-helpers";
export {
  getSectionRegistry,
  getSection,
  listSections,
  listSectionOptions,
  getPrimaryDocumentId,
  findSectionIdAtOffset,
  getProjectSectionContext,
} from "./section-helpers";

export {
  isEmptyManuscriptContent,
  sectionRefsFromContent,
  sectionRefsFromSections,
} from "./section-list-from-content";
export { hydrateSectionRegistry } from "./hydrate-section-registry";
export { SectionRegistryProvider } from "./SectionRegistryProvider";
export { useSectionRegistry } from "./hooks/useSectionRegistry";
export { useSectionOptions } from "./hooks/useSectionOptions";
export { useSectionLabel } from "./hooks/useSectionLabel";
export {
  sectionOptionsFromRefs,
  type SectionOption,
} from "./section-options";
export {
  findSectionRefById,
  findSectionStableIdAtOffset,
  mergeSectionBodiesById,
  resolveSectionLabel,
} from "./resolve-section";
