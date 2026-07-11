/**
 * =============================================================================
 * 최근 검색어 (LocalStorage)
 * -----------------------------------------------------------------------------
 * 프로젝트별로 최근 쿼리를 기억한다. Ctrl+K 팔레트 빈 상태에서 표시.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import type { RecentSearchEntry } from "@/features/global-search/types/search";
import { SEARCH_RECENT_STORAGE_KEY } from "@/lib/storage/keys";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

const MAX_RECENT = 8;

interface StoredRecentBucket {
  projectId: string;
  entries: RecentSearchEntry[];
}

function readAllBuckets(): StoredRecentBucket[] {
  return readJsonArray<StoredRecentBucket>(SEARCH_RECENT_STORAGE_KEY);
}

function writeAllBuckets(buckets: StoredRecentBucket[]): void {
  writeJsonArray(SEARCH_RECENT_STORAGE_KEY, buckets);
}

/** 해당 작품의 최근 검색어 (최신순) */
export function readRecentSearches(projectId: ProjectId): RecentSearchEntry[] {
  const bucket = readAllBuckets().find((b) => b.projectId === projectId);
  return bucket?.entries ?? [];
}

/** 쿼리를 최근 목록 맨 앞에 추가 (중복 시 끌어올림) */
export function pushRecentSearch(
  projectId: ProjectId,
  query: string,
): RecentSearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecentSearches(projectId);

  const buckets = readAllBuckets();
  const others = buckets.filter((b) => b.projectId !== projectId);
  const prev = buckets.find((b) => b.projectId === projectId)?.entries ?? [];

  const next: RecentSearchEntry[] = [
    { query: trimmed, searchedAt: nowIso() },
    ...prev.filter(
      (e) => e.query.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);

  writeAllBuckets([...others, { projectId, entries: next }]);
  return next;
}

/** 최근 검색어 한 줄 삭제 */
export function removeRecentSearch(
  projectId: ProjectId,
  query: string,
): RecentSearchEntry[] {
  const buckets = readAllBuckets();
  const others = buckets.filter((b) => b.projectId !== projectId);
  const prev = buckets.find((b) => b.projectId === projectId)?.entries ?? [];
  const next = prev.filter(
    (e) => e.query.toLowerCase() !== query.trim().toLowerCase(),
  );
  writeAllBuckets([...others, { projectId, entries: next }]);
  return next;
}
