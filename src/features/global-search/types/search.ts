/**
 * =============================================================================
 * Global Search — 타입
 * -----------------------------------------------------------------------------
 * 프로젝트 전체를 한 번에 검색한다.
 * 결과는 종류별 그룹으로 보여 주고, 클릭 시 해당 위치로 이동한다.
 * =============================================================================
 */

/** 검색 결과 종류 (그룹 키) */
export type SearchResultKind =
  | "manuscript"
  | "scene"
  | "character"
  | "memo"
  | "writing-vault"
  | "foreshadowing"
  | "reference";

/** 그룹 표시용 메타 (Notion 스타일 — 이모지 + 라벨) */
export const SEARCH_GROUP_META: Record<
  SearchResultKind,
  { label: string; icon: string; order: number }
> = {
  manuscript: { label: "Manuscript", icon: "📄", order: 1 },
  scene: { label: "Scene", icon: "🎬", order: 2 },
  character: { label: "Character", icon: "👤", order: 3 },
  "writing-vault": { label: "Writing Vault", icon: "💎", order: 4 },
  memo: { label: "Memo", icon: "📝", order: 5 },
  foreshadowing: { label: "복선", icon: "🎯", order: 6 },
  reference: { label: "작품(Reference)", icon: "📚", order: 7 },
};

/** 표시 순서대로 정렬된 종류 목록 */
export const SEARCH_KIND_ORDER: SearchResultKind[] = (
  Object.keys(SEARCH_GROUP_META) as SearchResultKind[]
).sort((a, b) => SEARCH_GROUP_META[a].order - SEARCH_GROUP_META[b].order);

export interface SearchResultItem {
  /** 리스트 키 (종류+대상 id+오프셋 등) */
  id: string;
  kind: SearchResultKind;
  /** 메인 제목 */
  title: string;
  /** 미리보기 / 부제 */
  preview: string;
  /** 이동 경로 (쿼리 포함) */
  href: string;
}

export interface SearchResultGroup {
  kind: SearchResultKind;
  label: string;
  icon: string;
  items: SearchResultItem[];
}

/** 최근 검색어 한 줄 */
export interface RecentSearchEntry {
  query: string;
  searchedAt: string;
}
