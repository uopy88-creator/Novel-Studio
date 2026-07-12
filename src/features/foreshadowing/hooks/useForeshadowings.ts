"use client";

/**
 * =============================================================================
 * useForeshadowings
 * -----------------------------------------------------------------------------
 * 복선 CRUD · 검색 · 상태 필터 · 정렬.
 * ForeshadowingService 를 통해 Storage/Supabase 와 통신한다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";
import {
  ForeshadowingService,
  type ForeshadowingSortMode,
  type ForeshadowingStatusFilter,
} from "@/features/foreshadowing/lib/foreshadowing-service";
import type { ForeshadowingInput } from "@/features/foreshadowing/lib/foreshadowing-storage";

export interface UseForeshadowingsResult {
  items: Foreshadowing[];
  filtered: Foreshadowing[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ForeshadowingStatusFilter;
  setStatusFilter: (status: ForeshadowingStatusFilter) => void;
  sortMode: ForeshadowingSortMode;
  setSortMode: (mode: ForeshadowingSortMode) => void;
  statusCounts: ReturnType<typeof ForeshadowingService.countByStatus>;
  create: (input: ForeshadowingInput) => Promise<Foreshadowing>;
  update: (
    id: ForeshadowingId,
    input: ForeshadowingInput,
  ) => Promise<Foreshadowing | null>;
  remove: (id: ForeshadowingId) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useForeshadowings(
  projectId: ProjectId,
): UseForeshadowingsResult {
  const [items, setItems] = useState<Foreshadowing[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ForeshadowingStatusFilter>("all");
  const [sortMode, setSortMode] = useState<ForeshadowingSortMode>("newest");

  const refresh = useCallback(async () => {
    setItems(await ForeshadowingService.listByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filtered = useMemo(
    () =>
      ForeshadowingService.query(items, {
        query: searchQuery,
        status: statusFilter,
        sort: sortMode,
      }),
    [items, searchQuery, statusFilter, sortMode],
  );

  const statusCounts = useMemo(
    () => ForeshadowingService.countByStatus(items),
    [items],
  );

  const create = useCallback(
    async (input: ForeshadowingInput) => {
      const item = await ForeshadowingService.create(projectId, input);
      setItems(await ForeshadowingService.listByProject(projectId));
      return item;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: ForeshadowingId, input: ForeshadowingInput) => {
      const item = await ForeshadowingService.update(id, input);
      setItems(await ForeshadowingService.listByProject(projectId));
      return item;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: ForeshadowingId) => {
      const ok = await ForeshadowingService.remove(id);
      setItems(await ForeshadowingService.listByProject(projectId));
      return ok;
    },
    [projectId],
  );

  return {
    items,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortMode,
    setSortMode,
    statusCounts,
    create,
    update,
    remove,
    refresh,
  };
}
