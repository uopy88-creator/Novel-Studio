"use client";

/**
 * =============================================================================
 * useProjectSearch
 * -----------------------------------------------------------------------------
 * 쿼리 디바운스(~200ms) → SearchService 호출.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import type { ProjectId } from "@/types/ids";
import type { SearchResultGroup } from "@/features/global-search/types/search";
import { searchService } from "@/features/global-search/lib/search-service";

const DEBOUNCE_MS = 200;

export function useProjectSearch(
  projectId: ProjectId,
  query: string,
  projectName = "",
) {
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setGroups([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await searchService.search(projectId, trimmed, {
            projectName,
            mode: "keyword",
          });
          if (cancelled) return;
          setGroups(next);
          setError(null);
        } catch (err) {
          if (cancelled) return;
          console.error("[useProjectSearch]", err);
          setGroups([]);
          setError(
            err instanceof Error ? err.message : "검색에 실패했습니다.",
          );
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [projectId, query, projectName]);

  return { groups, isSearching, error };
}
