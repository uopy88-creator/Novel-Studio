/**
 * manuscript feature 공개 진입점.
 * - Documents: Document(목차) 관리
 * - Manuscript: 원고 편집
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
export { SceneNavigator } from "./components/scene-navigator";
export { useManuscript } from "./hooks/useManuscript";
export { useScenes } from "./hooks/useScenes";
export type { Scene, SceneDelimiterConfig } from "./types/scene";
