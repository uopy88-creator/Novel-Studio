/**
 * =============================================================================
 * Global Search (프로젝트 전체 검색)
 * =============================================================================
 */

export { SearchModal } from "./components/SearchModal";
export type { SearchModalProps } from "./components/SearchModal";
export { GlobalSearchModal } from "./components/GlobalSearchModal";
export type { GlobalSearchModalProps } from "./components/GlobalSearchModal";
export { SearchResultItem } from "./components/SearchResultItem";
export type { SearchResultItemProps } from "./components/SearchResultItem";

export { searchService, SearchService, searchProject } from "./lib/search-service";
export { SearchIndex, buildSearchIndex } from "./lib/search-index";
export { highlightQuery } from "./lib/highlight";

export type {
  SearchDocument,
  SearchOptions,
  SearchResultGroup,
  SearchResultItem as SearchResultItemModel,
  SearchResultKind,
} from "./types/search";
