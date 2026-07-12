/**
 * =============================================================================
 * Global Search — 타입
 * -----------------------------------------------------------------------------
 * 확장 가능한 검색 인덱스 / 결과 모델.
 * 향후 AI 검색 프로바이더도 같은 SearchResultItem 을 반환하면 된다.
 * =============================================================================
 */

/** 검색 결과 종류 (그룹 키) */
export type SearchResultKind =
  | "manuscript"
  | "section"
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
  section: { label: "Section", icon: "🎬", order: 2 },
  scene: { label: "Section", icon: "🎬", order: 2 },
  character: { label: "Character", icon: "👤", order: 3 },
  "writing-vault": { label: "Writing Vault", icon: "💎", order: 4 },
  memo: { label: "Memo", icon: "📝", order: 5 },
  foreshadowing: { label: "Foreshadowing", icon: "📌", order: 6 },
  reference: { label: "Reference", icon: "📚", order: 7 },
};

/** 표시 순서대로 정렬된 종류 목록 */
export const SEARCH_KIND_ORDER: SearchResultKind[] = (
  Object.keys(SEARCH_GROUP_META) as SearchResultKind[]
).sort((a, b) => SEARCH_GROUP_META[a].order - SEARCH_GROUP_META[b].order);

/**
 * 검색 인덱스에 들어가는 문서 단위.
 * 종류가 늘어나면 이 형태로만 추가하면 SearchService 가 처리한다.
 */
export interface SearchDocument {
  id: string;
  kind: SearchResultKind;
  title: string;
  /** 검색·미리보기용 본문 */
  body: string;
  projectId: string;
  projectName: string;
  href: string;
}

/** UI 한 행 */
export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  /** 미리보기 (최대 2줄 표시) */
  preview: string;
  /** 소속 작품명 */
  projectName: string;
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

/** SearchService 옵션 — AI 검색 확장 시 mode 등 추가 */
export interface SearchOptions {
  projectName?: string;
  /** 향후: "keyword" | "ai" */
  mode?: "keyword" | "ai";
}
