/**
 * =============================================================================
 * SearchService
 * -----------------------------------------------------------------------------
 * 키워드 검색(기본) + 향후 AI 검색 프로바이더를 붙일 수 있는 진입점.
 *
 * 사용
 *   await searchService.search(projectId, query, { projectName })
 *
 * AI 확장
 *   searchService.registerProvider(aiProvider)
 *   searchService.search(..., { mode: "ai" })
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import type {
  SearchDocument,
  SearchOptions,
  SearchResultGroup,
  SearchResultItem,
  SearchResultKind,
} from "@/features/global-search/types/search";
import {
  SEARCH_GROUP_META,
  SEARCH_KIND_ORDER,
} from "@/features/global-search/types/search";
import { buildSearchIndex } from "@/features/global-search/lib/search-index";

function includesIgnoreCase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** 미리보기 — 공백 정리 후 약 2줄 분량 */
export function clipPreview(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * 매치 주변 스니펫을 만든다.
 * 쿼리가 본문에 있으면 그 주변을, 없으면 앞부분을 자른다.
 */
export function makeSnippet(body: string, query: string, max = 140): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const q = query.trim();
  if (!q) return clipPreview(clean, max);

  const lower = clean.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return clipPreview(clean, max);

  const pad = Math.floor((max - q.length) / 2);
  const start = Math.max(0, idx - pad);
  const end = Math.min(clean.length, start + max);
  const slice = clean.slice(start, end);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < clean.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

export interface SearchProvider {
  /** 고유 id — "keyword" | "ai" 등 */
  id: string;
  /**
   * 인덱스에서 히트를 고른다.
   * AI 프로바이더는 비동기로 네트워크 호출해도 된다.
   */
  search: (
    query: string,
    documents: SearchDocument[],
  ) => SearchResultItem[] | Promise<SearchResultItem[]>;
}

/** 기본 키워드 프로바이더 — title/body 부분 일치 */
export const keywordSearchProvider: SearchProvider = {
  id: "keyword",
  search(query, documents) {
    const q = query.trim();
    if (!q) return [];

    const hits: SearchResultItem[] = [];
    for (const doc of documents) {
      // Manuscript 문장 히트는 이미 쿼리로 인덱싱됨 → 그대로 포함
      if (doc.kind === "manuscript") {
        hits.push({
          id: doc.id,
          kind: doc.kind,
          title: doc.title,
          preview: clipPreview(doc.body),
          projectName: doc.projectName,
          href: doc.href,
        });
        continue;
      }

      const blob = `${doc.title}\n${doc.body}`;
      if (!includesIgnoreCase(blob, q)) continue;

      hits.push({
        id: doc.id,
        kind: doc.kind,
        title: doc.title,
        preview: makeSnippet(doc.body || doc.title, q),
        projectName: doc.projectName,
        href: doc.href,
      });
    }
    return hits;
  },
};

function groupHits(hits: SearchResultItem[]): SearchResultGroup[] {
  const buckets: Record<SearchResultKind, SearchResultItem[]> = {
    manuscript: [],
    scene: [],
    character: [],
    memo: [],
    "writing-vault": [],
    foreshadowing: [],
    reference: [],
  };

  for (const hit of hits) {
    buckets[hit.kind].push(hit);
  }

  return SEARCH_KIND_ORDER.map((kind) => ({
    kind,
    label: SEARCH_GROUP_META[kind].label,
    icon: SEARCH_GROUP_META[kind].icon,
    items: buckets[kind],
  })).filter((g) => g.items.length > 0);
}

export class SearchService {
  private providers = new Map<string, SearchProvider>();

  constructor(providers: SearchProvider[] = [keywordSearchProvider]) {
    for (const provider of providers) {
      this.registerProvider(provider);
    }
  }

  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): SearchProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * 프로젝트 검색.
   * mode 기본값 keyword. AI 프로바이더 등록 후 mode:"ai" 로 전환 가능.
   */
  async search(
    projectId: ProjectId,
    rawQuery: string,
    options: SearchOptions = {},
  ): Promise<SearchResultGroup[]> {
    const query = rawQuery.trim();
    if (!query) return [];

    const mode = options.mode ?? "keyword";
    const provider =
      this.providers.get(mode) ?? this.providers.get("keyword");
    if (!provider) return [];

    const documents = await buildSearchIndex({
      projectId,
      projectName: options.projectName?.trim() || "작품",
      query,
    });

    const hits = await provider.search(query, documents);
    return groupHits(hits);
  }
}

/** 앱 전역 기본 서비스 (AI 프로바이더는 나중에 register) */
export const searchService = new SearchService();

/** 하위 호환 — 기존 searchProject(projectId, query) 호출 */
export async function searchProject(
  projectId: ProjectId,
  rawQuery: string,
  options?: SearchOptions,
): Promise<SearchResultGroup[]> {
  return searchService.search(projectId, rawQuery, options);
}

/** 그룹 배열을 평탄화 (키보드 네비게이션용) */
export function flattenSearchGroups(
  groups: SearchResultGroup[],
): SearchResultItem[] {
  return groups.flatMap((g) => g.items);
}
