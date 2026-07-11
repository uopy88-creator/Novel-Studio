"use client";

/**
 * =============================================================================
 * useManuscript — 프로젝트 전체 원고
 * -----------------------------------------------------------------------------
 * Manuscript 는 항상 프로젝트의 Chapter 전체를 이어 붙인 하나의 문서다.
 * 저장 시 Chapter 블록으로 나눠 Document별 manuscript 행에 기록한다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  reorderChaptersByIds,
  updateChapter,
} from "@/features/manuscript/lib/chapter-storage";
import {
  loadProjectManuscript,
  saveProjectManuscript,
} from "@/features/manuscript/lib/project-manuscript";
import {
  joinChapterBodies,
  parseChapterBlocks,
  replaceChapterBodyInContent,
  splitChapterBodies,
  type ChapterBlock,
} from "@/features/manuscript/lib/chapter-blocks";
import { useUserSettings } from "@/features/settings";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface UseManuscriptResult {
  documents: Chapter[];
  isReady: boolean;
  /** 현재 포커스(Scene·버전·영감)용 Chapter */
  selectedChapterId: ChapterId | null;
  selectDocument: (chapterId: ChapterId) => void;
  /** 프로젝트 전체 통합 원고 */
  content: string;
  setContent: (value: string) => void;
  /** Chapter 본문만 교체 (Scene Navigator 연동) */
  setChapterBody: (chapterId: ChapterId, body: string) => void;
  chapterBlocks: ChapterBlock[];
  /** Chapters DnD — 목록·원고 순서 양방향 동기화 */
  reorderDocuments: (activeId: string, overId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  renameDocumentTitle: (chapterId: ChapterId, title: string) => Promise<void>;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveNow: () => void;
}

export function useManuscript(
  projectId: ProjectId,
  initialDocumentId?: ChapterId | null,
): UseManuscriptResult {
  const { settings } = useUserSettings();
  const autosaveMs = settings.autosaveIntervalSeconds * 1000;

  const [documents, setDocuments] = useState<Chapter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<ChapterId | null>(
    null,
  );
  const [content, setContentState] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const contentRef = useRef(content);
  const documentsRef = useRef(documents);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  contentRef.current = content;
  documentsRef.current = documents;

  const chapterBlocks = useMemo(
    () => parseChapterBlocks(content, documents),
    [content, documents],
  );

  const persist = useCallback(
    (value: string, chapters: Chapter[]) => {
      if (chapters.length === 0) return;
      setSaveStatus("saving");
      void (async () => {
        try {
          const saved = await saveProjectManuscript({
            projectId,
            chapters,
            content: value,
          });
          dirtyRef.current = false;
          setLastSavedAt(saved.updatedAt);
          setSaveStatus("saved");
        } catch (error) {
          console.error("[useManuscript] save failed", error);
          setSaveStatus("error");
        }
      })();
    },
    [projectId],
  );

  const reload = useCallback(async () => {
    const { chapters, content: joined } = await loadProjectManuscript(projectId);
    setDocuments(chapters);
    setContentState(joined);
    dirtyRef.current = false;
    setSaveStatus("idle");

    setSelectedChapterId((current) => {
      if (current && chapters.some((c) => c.id === current)) return current;
      if (
        initialDocumentId &&
        chapters.some((c) => c.id === initialDocumentId)
      ) {
        return initialDocumentId;
      }
      return chapters[0]?.id ?? null;
    });
  }, [projectId, initialDocumentId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
        if (!cancelled) setIsReady(true);
      } catch {
        if (cancelled) return;
        setDocuments([]);
        setContentState("");
        setIsReady(true);
        setSaveStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persist(contentRef.current, documentsRef.current);
  }, [persist]);

  const selectDocument = useCallback((chapterId: ChapterId) => {
    setSelectedChapterId(chapterId);
  }, []);

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      dirtyRef.current = true;
      setSaveStatus("dirty");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        persist(value, documentsRef.current);
      }, autosaveMs);
    },
    [persist, autosaveMs],
  );

  const setChapterBody = useCallback(
    (chapterId: ChapterId, body: string) => {
      const next = replaceChapterBodyInContent(
        contentRef.current,
        documentsRef.current,
        chapterId,
        body,
      );
      setContent(next);
    },
    [setContent],
  );

  const refreshDocuments = useCallback(async () => {
    // dirty 면 먼저 저장
    if (dirtyRef.current) {
      await saveProjectManuscript({
        projectId,
        chapters: documentsRef.current,
        content: contentRef.current,
      });
      dirtyRef.current = false;
    }
    await reload();
  }, [projectId, reload]);

  const reorderDocuments = useCallback(
    async (activeId: string, overId: string) => {
      const list = documentsRef.current;
      const from = list.findIndex((d) => d.id === activeId);
      const to = list.findIndex((d) => d.id === overId);
      if (from < 0 || to < 0 || from === to) return;

      // 현재 본문 보존
      const bodies = splitChapterBodies(contentRef.current, list);
      const nextDocs = [...list];
      const [moved] = nextDocs.splice(from, 1);
      nextDocs.splice(to, 0, moved);

      const joined = joinChapterBodies(nextDocs, bodies);
      setDocuments(nextDocs.map((d, i) => ({ ...d, sortOrder: i })));
      setContentState(joined);
      dirtyRef.current = true;
      setSaveStatus("dirty");

      try {
        const saved = await reorderChaptersByIds(
          projectId,
          nextDocs.map((d) => d.id),
        );
        setDocuments(saved);
        await saveProjectManuscript({
          projectId,
          chapters: saved,
          content: joined,
        });
        dirtyRef.current = false;
        setSaveStatus("saved");
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        console.error("[useManuscript] reorder failed", error);
        await reload();
        setSaveStatus("error");
      }
    },
    [projectId, reload],
  );

  const renameDocumentTitle = useCallback(
    async (chapterId: ChapterId, title: string) => {
      const chapter = documentsRef.current.find((d) => d.id === chapterId);
      if (!chapter) return;
      await updateChapter(chapterId, {
        title,
        kind: chapter.kind,
        description: chapter.summary,
      });
      const bodies = splitChapterBodies(
        contentRef.current,
        documentsRef.current,
      );
      const nextDocs = documentsRef.current.map((d) =>
        d.id === chapterId ? { ...d, title: title.trim() || d.title } : d,
      );
      setDocuments(nextDocs);
      setContentState(joinChapterBodies(nextDocs, bodies));
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current && documentsRef.current.length > 0) {
        void saveProjectManuscript({
          projectId,
          chapters: documentsRef.current,
          content: contentRef.current,
        });
      }
    };
  }, [projectId]);

  return {
    documents,
    isReady,
    selectedChapterId,
    selectDocument,
    content,
    setContent,
    setChapterBody,
    chapterBlocks,
    reorderDocuments,
    refreshDocuments,
    renameDocumentTitle,
    saveStatus,
    lastSavedAt,
    saveNow,
  };
}
