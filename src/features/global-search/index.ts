/**
 * =============================================================================
 * Global Search (프로젝트 전체 검색)
 * =============================================================================
 */

export { GlobalSearchModal } from "./components/GlobalSearchModal";
export type { GlobalSearchModalProps } from "./components/GlobalSearchModal";
export { searchProject } from "./lib/search-project";
export type {
  SearchResultGroup,
  SearchResultItem,
  SearchResultKind,
} from "./types/search";
