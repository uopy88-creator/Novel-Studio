"use client";

/**
 * =============================================================================
 * useDialogues
 * -----------------------------------------------------------------------------
 * Dialogue Vault — Cloud(DB) 우선, LocalStorage 백업.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { DialogueId, ProjectId } from "@/types/ids";
import {
  createDialogue,
  deleteDialogue,
  filterDialogues,
  readDialoguesByProject,
  toggleDialogueFavorite,
  updateDialogue,
  type DialogueInput,
} from "@/features/dialogue-vault/lib/dialogue-storage";

export interface UseDialoguesResult {
  dialogues: Dialogue[];
  filtered: Dialogue[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  create: (input: DialogueInput) => Promise<Dialogue>;
  update: (id: DialogueId, input: DialogueInput) => Promise<Dialogue | null>;
  remove: (id: DialogueId) => Promise<boolean>;
  toggleFavorite: (id: DialogueId) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDialogues(projectId: ProjectId): UseDialoguesResult {
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setDialogues(await readDialoguesByProject(projectId));
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
    () => filterDialogues(dialogues, searchQuery),
    [dialogues, searchQuery],
  );

  const create = useCallback(
    async (input: DialogueInput) => {
      const dialogue = await createDialogue(projectId, input);
      setDialogues(await readDialoguesByProject(projectId));
      return dialogue;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: DialogueId, input: DialogueInput) => {
      const dialogue = await updateDialogue(id, input);
      setDialogues(await readDialoguesByProject(projectId));
      return dialogue;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: DialogueId) => {
      const ok = await deleteDialogue(id);
      setDialogues(await readDialoguesByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const toggleFavorite = useCallback(
    async (id: DialogueId) => {
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
    create,
    update,
    remove,
    toggleFavorite,
    refresh,
  };
}
