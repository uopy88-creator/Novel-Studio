/**
 * sections feature — Project-wide Section Registry (SSOT)
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
export {
  isEmptyManuscriptContent,
  sectionRefsFromContent,
  sectionRefsFromSections,
} from "./section-list-from-content";
export { hydrateSectionRegistry } from "./hydrate-section-registry";
export { SectionRegistryProvider } from "./SectionRegistryProvider";
export { useSectionRegistry } from "./hooks/useSectionRegistry";
