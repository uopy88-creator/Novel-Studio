"use client";

/**
 * =============================================================================
 * useInspirations
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { DocumentId, InspirationId, ProjectId } from "@/types/ids";
import {
  createInspiration,
  deleteInspiration,
  filterInspirations,
  pickRecentInspirations,
  readInspirationsByDocument,
  readInspirationsByProject,
  sortInspirations,
  updateInspiration,
  type InspirationCreateParams,
  type InspirationInput,
  type InspirationSortMode,
} from "@/features/inspiration/lib/inspiration-storage";

export interface UseInspirationsResult {
  inspirations: Inspiration[];
  filtered: Inspiration[];
  recent: Inspiration[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: InspirationSortMode;
  setSortMode: (mode: InspirationSortMode) => void;
  create: (params: InspirationCreateParams) => Promise<Inspiration>;
  update: (
    id: InspirationId,
    input: InspirationInput,
  ) => Promise<Inspiration | null>;
  remove: (id: InspirationId) => Promise<boolean>;
  refresh: () => Promise<void>;
  listByDocument: (documentId: DocumentId) => Promise<Inspiration[]>;
}

export function useInspirations(projectId: ProjectId): UseInspirationsResult {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<InspirationSortMode>("recent");

  const refresh = useCallback(async () => {
    setInspirations(await readInspirationsByProject(projectId));
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

  const filtered = useMemo(() => {
    const searched = filterInspirations(inspirations, searchQuery);
    return sortInspirations(searched, sortMode);
  }, [inspirations, searchQuery, sortMode]);

  const recent = useMemo(
    () => pickRecentInspirations(inspirations, 3),
    [inspirations],
  );

  const create = useCallback(
    async (params: InspirationCreateParams) => {
      const item = await createInspiration(projectId, params);
      setInspirations(await readInspirationsByProject(projectId));
      return item;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: InspirationId, input: InspirationInput) => {
      const item = await updateInspiration(id, input);
      setInspirations(await readInspirationsByProject(projectId));
      return item;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: InspirationId) => {
      const ok = await deleteInspiration(id);
      setInspirations(await readInspirationsByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const listByDocument = useCallback(
    async (documentId: DocumentId) => {
      return readInspirationsByDocument(projectId, documentId);
    },
    [projectId],
  );

  return {
    inspirations,
    filtered,
    recent,
    isReady,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    create,
    update,
    remove,
    refresh,
    listByDocument,
  };
}
