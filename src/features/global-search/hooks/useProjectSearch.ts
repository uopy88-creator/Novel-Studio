"use client";

/**
 * =============================================================================
 * useProjectSearch
 * -----------------------------------------------------------------------------
 * 쿼리 디바운스 → searchProject 호출. 로딩/에러/그룹 결과 관리.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import type { ProjectId } from "@/types/ids";
import type { SearchResultGroup } from "@/features/global-search/types/search";
import { searchProject } from "@/features/global-search/lib/search-project";

const DEBOUNCE_MS = 180;

export function useProjectSearch(projectId: ProjectId, query: string) {
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
          const next = await searchProject(projectId, trimmed);
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
  }, [projectId, query]);

  return { groups, isSearching, error };
}
