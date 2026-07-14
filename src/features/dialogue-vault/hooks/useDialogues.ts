"use client";

/**
 * =============================================================================
 * useDialogues → Writing Vault
 * -----------------------------------------------------------------------------
 * 검색 · 종류 필터 · CRUD · 즐겨찾기
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  WritingVaultEntry,
  WritingVaultType,
} from "@/features/dialogue-vault/types/dialogue";
import type { ProjectId, WritingVaultEntryId } from "@/types/ids";
import {
  createDialogue,
  deleteDialogue,
  filterDialogues,
  filterDialoguesByType,
  readDialoguesByProject,
  toggleDialogueFavorite,
  updateDialogue,
  type WritingVaultInput,
} from "@/features/dialogue-vault/lib/dialogue-storage";

export type WritingVaultTypeFilter = WritingVaultType | "all";

export interface UseDialoguesResult {
  dialogues: WritingVaultEntry[];
  filtered: WritingVaultEntry[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: WritingVaultTypeFilter;
  setTypeFilter: (type: WritingVaultTypeFilter) => void;
  create: (input: WritingVaultInput) => Promise<WritingVaultEntry>;
  update: (
    id: WritingVaultEntryId,
    input: WritingVaultInput,
  ) => Promise<WritingVaultEntry | null>;
  remove: (id: WritingVaultEntryId) => Promise<boolean>;
  toggleFavorite: (id: WritingVaultEntryId) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDialogues(projectId: ProjectId): UseDialoguesResult {
  const [dialogues, setDialogues] = useState<WritingVaultEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<WritingVaultTypeFilter>("all");

  const refresh = useCallback(async () => {
    setDialogues(await readDialoguesByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const byType = filterDialoguesByType(dialogues, typeFilter);
    return filterDialogues(byType, searchQuery);
  }, [dialogues, searchQuery, typeFilter]);

  const create = useCallback(
    async (input: WritingVaultInput) => {
      const entry = await createDialogue(projectId, input);
      setDialogues(await readDialoguesByProject(projectId));
      return entry;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: WritingVaultEntryId, input: WritingVaultInput) => {
      const entry = await updateDialogue(id, input);
      setDialogues(await readDialoguesByProject(projectId));
      return entry;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: WritingVaultEntryId) => {
      const ok = await deleteDialogue(id);
      setDialogues(await readDialoguesByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const toggleFavorite = useCallback(
    async (id: WritingVaultEntryId) => {
      await toggleDialogueFavorite(id);
      setDialogues(await readDialoguesByProject(projectId));
    },
    [projectId],
  );

  return {
    dialogues,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    create,
    update,
    remove,
    toggleFavorite,
    refresh,
  };
}
