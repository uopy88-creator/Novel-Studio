"use client";

/**
 * =============================================================================
 * useDialogues
 * -----------------------------------------------------------------------------
 * Dialogue Vault CRUD + 즐겨찾기 + 검색 필터.
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
  /** 검색 적용 전 전체 (즐겨찾기 상단 정렬됨) */
  dialogues: Dialogue[];
  /** 검색어가 반영된 목록 */
  filtered: Dialogue[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  create: (input: DialogueInput) => Dialogue;
  update: (id: DialogueId, input: DialogueInput) => Dialogue | null;
  remove: (id: DialogueId) => boolean;
  toggleFavorite: (id: DialogueId) => void;
  refresh: () => void;
}

export function useDialogues(projectId: ProjectId): UseDialoguesResult {
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(() => {
    setDialogues(readDialoguesByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
    setIsReady(true);
  }, [refresh]);

  const filtered = useMemo(
    () => filterDialogues(dialogues, searchQuery),
    [dialogues, searchQuery],
  );

  const create = useCallback(
    (input: DialogueInput) => {
      const dialogue = createDialogue(projectId, input);
      setDialogues(readDialoguesByProject(projectId));
      return dialogue;
    },
    [projectId],
  );

  const update = useCallback(
    (id: DialogueId, input: DialogueInput) => {
      const dialogue = updateDialogue(id, input);
      setDialogues(readDialoguesByProject(projectId));
      return dialogue;
    },
    [projectId],
  );

  const remove = useCallback(
    (id: DialogueId) => {
      const ok = deleteDialogue(id);
      setDialogues(readDialoguesByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const toggleFavorite = useCallback(
    (id: DialogueId) => {
      toggleDialogueFavorite(id);
      setDialogues(readDialoguesByProject(projectId));
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
