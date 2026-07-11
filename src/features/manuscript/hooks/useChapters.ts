"use client";

/**
 * =============================================================================
 * useChapters
 * -----------------------------------------------------------------------------
 * Document 목록 — Cloud(DB) 우선, LocalStorage 백업.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  createChapter,
  deleteChapter,
  moveChapter,
  readChaptersByProject,
  reorderChaptersByIds,
  updateChapter,
  type ChapterInput,
} from "@/features/manuscript/lib/chapter-storage";

export interface UseChaptersResult {
  chapters: Chapter[];
  isReady: boolean;
  create: (input: ChapterInput) => Promise<Chapter>;
  update: (id: ChapterId, input: ChapterInput) => Promise<Chapter | null>;
  remove: (id: ChapterId) => Promise<boolean>;
  moveUp: (id: ChapterId) => Promise<void>;
  moveDown: (id: ChapterId) => Promise<void>;
  reorder: (activeId: string, overId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChapters(projectId: ProjectId): UseChaptersResult {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    setChapters(await readChaptersByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setChapters([]);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const create = useCallback(
    async (input: ChapterInput) => {
      const chapter = await createChapter(projectId, input);
      setChapters(await readChaptersByProject(projectId));
      return chapter;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: ChapterId, input: ChapterInput) => {
      const chapter = await updateChapter(id, input);
      setChapters(await readChaptersByProject(projectId));
      return chapter;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: ChapterId) => {
      const ok = await deleteChapter(id);
      setChapters(await readChaptersByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const moveUp = useCallback(
    async (id: ChapterId) => {
      await moveChapter(id, "up");
      setChapters(await readChaptersByProject(projectId));
    },
    [projectId],
  );

  const moveDown = useCallback(
    async (id: ChapterId) => {
      await moveChapter(id, "down");
      setChapters(await readChaptersByProject(projectId));
    },
    [projectId],
  );

  const reorder = useCallback(
    async (activeId: string, overId: string) => {
      const from = chapters.findIndex((c) => c.id === activeId);
      const to = chapters.findIndex((c) => c.id === overId);
      if (from < 0 || to < 0 || from === to) return;

      const next = [...chapters];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setChapters(next.map((c, i) => ({ ...c, sortOrder: i })));

      try {
        const saved = await reorderChaptersByIds(
          projectId,
          next.map((c) => c.id),
        );
        setChapters(saved);
      } catch (error) {
        console.error("[useChapters] reorder failed", error);
        setChapters(await readChaptersByProject(projectId));
      }
    },
    [chapters, projectId],
  );

  return {
    chapters,
    isReady,
    create,
    update,
    remove,
    moveUp,
    moveDown,
    reorder,
    refresh,
  };
}

export const useDocuments = useChapters;
