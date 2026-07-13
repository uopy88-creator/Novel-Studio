"use client";

/**
 * =============================================================================
 * useMemos — Memo 목록 · CRUD · Pin 정렬
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Memo } from "@/features/memo/types/memo";
import type { MemoId, ProjectId } from "@/types/ids";
import {
  createMemo,
  deleteMemo,
  filterMemos,
  readMemosByProject,
  sortMemos,
  updateMemo,
  type MemoInput,
} from "@/features/memo/lib/memo-storage";

export interface UseMemosResult {
  memos: Memo[];
  filtered: Memo[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  create: (input: MemoInput) => Promise<Memo>;
  update: (id: MemoId, input: Partial<MemoInput>) => Promise<Memo | null>;
  remove: (id: MemoId) => Promise<boolean>;
  togglePin: (id: MemoId) => Promise<Memo | null>;
  refresh: () => Promise<void>;
}

export function useMemos(projectId: ProjectId): UseMemosResult {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setMemos(await readMemosByProject(projectId));
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
    () => sortMemos(filterMemos(memos, searchQuery)),
    [memos, searchQuery],
  );

  const create = useCallback(
    async (input: MemoInput) => {
      const item = await createMemo(projectId, input);
      await refresh();
      return item;
    },
    [projectId, refresh],
  );

  const update = useCallback(
    async (id: MemoId, input: Partial<MemoInput>) => {
      const item = await updateMemo(id, input);
      await refresh();
      return item;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: MemoId) => {
      const ok = await deleteMemo(id);
      await refresh();
      return ok;
    },
    [refresh],
  );

  const togglePin = useCallback(
    async (id: MemoId) => {
      const current = memos.find((m) => m.id === id);
      if (!current) return null;
      return update(id, { isPinned: !current.isPinned });
    },
    [memos, update],
  );

  return {
    memos,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    create,
    update,
    remove,
    togglePin,
    refresh,
  };
}
