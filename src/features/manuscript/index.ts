/**
 * manuscript feature 공개 진입점.
 * - Manuscript: 원고 편집 · Section Navigator
 */
export { DocumentsPage } from "./components/DocumentsPage";
export { DocumentCard } from "./components/DocumentCard";
export { DocumentList } from "./components/DocumentList";
export { DocumentModal } from "./components/DocumentModal";
export { DocumentDeleteDialog } from "./components/DocumentDeleteDialog";
export { useChapters, useDocuments } from "./hooks/useChapters";

export { ManuscriptWorkspace } from "./components/ManuscriptWorkspace";
export { ManuscriptEditor } from "./components/ManuscriptEditor";
export { SearchBar } from "./components/SearchBar";
export { StatisticsPanel } from "./components/StatisticsPanel";
export { AutoSaveIndicator } from "./components/AutoSaveIndicator";
export { AutoRecoveryDialog } from "./components/AutoRecoveryDialog";
export { SectionNavigator } from "./components/section-navigator";
/** @deprecated Use SectionNavigator */
export { SceneNavigator } from "./components/scene-navigator";
export { ManuscriptVersionModal } from "./components/version-history";
export { useManuscript } from "./hooks/useManuscript";
export { useSections } from "./hooks/useSections";
/** @deprecated Use useSections */
export { useScenes } from "./hooks/useScenes";
export { useManuscriptVersions } from "./hooks/useManuscriptVersions";
export { useAutoRecovery } from "./hooks/useAutoRecovery";
export type {
  Section,
  SectionDelimiterConfig,
  SectionStatus,
  SectionMeta,
} from "./types/section";
/** @deprecated Use Section types */
export type { Scene, SceneDelimiterConfig } from "./types/scene";
export type { ManuscriptVersion } from "./types/manuscript-version";
export { displayVersionName } from "./types/manuscript-version";
export type {
  ManuscriptRecoveryDraft,
  RecoveryOffer,
} from "./types/manuscript-recovery";
