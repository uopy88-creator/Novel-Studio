"use client";

/**
 * =============================================================================
 * useChapters
 * -----------------------------------------------------------------------------
 * 특정 작품(projectId)의 챕터 목록 + CRUD + 위/아래 이동.
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
  updateChapter,
  type ChapterInput,
} from "@/features/manuscript/lib/chapter-storage";

export interface UseChaptersResult {
  chapters: Chapter[];
  isReady: boolean;
  create: (input: ChapterInput) => Chapter;
  update: (id: ChapterId, input: ChapterInput) => Chapter | null;
  remove: (id: ChapterId) => boolean;
  moveUp: (id: ChapterId) => void;
  moveDown: (id: ChapterId) => void;
  refresh: () => void;
}

export function useChapters(projectId: ProjectId): UseChaptersResult {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setChapters(readChaptersByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
    setIsReady(true);
  }, [refresh]);

  const create = useCallback(
    (input: ChapterInput) => {
      const chapter = createChapter(projectId, input);
      setChapters(readChaptersByProject(projectId));
      return chapter;
    },
    [projectId],
  );

  const update = useCallback(
    (id: ChapterId, input: ChapterInput) => {
      const chapter = updateChapter(id, input);
      setChapters(readChaptersByProject(projectId));
      return chapter;
    },
    [projectId],
  );

  const remove = useCallback(
    (id: ChapterId) => {
      const ok = deleteChapter(id);
      setChapters(readChaptersByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const moveUp = useCallback(
    (id: ChapterId) => {
      moveChapter(id, "up");
      setChapters(readChaptersByProject(projectId));
    },
    [projectId],
  );

  const moveDown = useCallback(
    (id: ChapterId) => {
      moveChapter(id, "down");
      setChapters(readChaptersByProject(projectId));
    },
    [projectId],
  );

  return {
    chapters,
    isReady,
    create,
    update,
    remove,
    moveUp,
    moveDown,
    refresh,
  };
}
