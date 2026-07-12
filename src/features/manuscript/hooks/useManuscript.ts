"use client";

/**
 * =============================================================================
 * useManuscript — 프로젝트 전체 원고
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (hidden Document) → Sections
 *
 * Manuscript 는 프로젝트당 하나의 평탄한 원고다.
 * Section Navigator 가 전체 content 를 조작한다.
 * Chapter UI / 구분선 편집은 제거되었다.
 * =============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import { updateChapter } from "@/features/manuscript/lib/chapter-storage";
import {
  loadProjectManuscript,
  saveProjectManuscript,
} from "@/features/manuscript/lib/project-manuscript";
import { useUserSettings } from "@/features/settings";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface UseManuscriptResult {
  documents: Chapter[];
  isReady: boolean;
  /** 숨은 primary Manuscript Document ID */
  primaryDocumentId: ChapterId | null;
  /** @deprecated primaryDocumentId 와 동일 — 버전/복구 호환 */
  selectedChapterId: ChapterId | null;
  selectDocument: (chapterId: ChapterId) => void;
  /** 프로젝트 전체 통합 원고 (Section 마커 포함) */
  content: string;
  setContent: (value: string) => void;
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
  // initialDocumentId kept for deep-link API compat; primary document is used after migration.
  void initialDocumentId;
  const { settings } = useUserSettings();
  const autosaveMs = settings.autosaveIntervalSeconds * 1000;

  const [documents, setDocuments] = useState<Chapter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [primaryDocumentId, setPrimaryDocumentId] =
    useState<ChapterId | null>(null);
  const [content, setContentState] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const contentRef = useRef(content);
  const documentsRef = useRef(documents);
  const primaryRef = useRef(primaryDocumentId);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  contentRef.current = content;
  documentsRef.current = documents;
  primaryRef.current = primaryDocumentId;

  const persist = useCallback(
    (value: string, chapters: Chapter[], primaryId: ChapterId | null) => {
      if (!primaryId) return;
      setSaveStatus("saving");
      void (async () => {
        try {
          const saved = await saveProjectManuscript({
            projectId,
            chapters,
            content: value,
            primaryDocumentId: primaryId,
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
    const {
      chapters,
      content: joined,
      primaryDocumentId: primaryId,
    } = await loadProjectManuscript(projectId);
    setDocuments(chapters);
    setPrimaryDocumentId(primaryId);
    setContentState(joined);
    dirtyRef.current = false;
    setSaveStatus("idle");
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
        if (!cancelled) setIsReady(true);
      } catch (error) {
        console.error("[useManuscript] load failed", error);
        if (cancelled) return;
        setDocuments([]);
        setContentState("");
        setPrimaryDocumentId(null);
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
    persist(contentRef.current, documentsRef.current, primaryRef.current);
  }, [persist]);

  const selectDocument = useCallback((chapterId: ChapterId) => {
    setPrimaryDocumentId(chapterId);
  }, []);

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      dirtyRef.current = true;
      setSaveStatus("dirty");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        persist(value, documentsRef.current, primaryRef.current);
      }, autosaveMs);
    },
    [persist, autosaveMs],
  );

  const refreshDocuments = useCallback(async () => {
    if (dirtyRef.current && primaryRef.current) {
      await saveProjectManuscript({
        projectId,
        chapters: documentsRef.current,
        content: contentRef.current,
        primaryDocumentId: primaryRef.current,
      });
      dirtyRef.current = false;
    }
    await reload();
  }, [projectId, reload]);

  const renameDocumentTitle = useCallback(
    async (chapterId: ChapterId, title: string) => {
      const chapter = documentsRef.current.find((d) => d.id === chapterId);
      if (!chapter) return;
      await updateChapter(chapterId, {
        title,
        kind: chapter.kind,
        description: chapter.summary,
      });
      setDocuments(
        documentsRef.current.map((d) =>
          d.id === chapterId ? { ...d, title: title.trim() || d.title } : d,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current && primaryRef.current) {
        void saveProjectManuscript({
          projectId,
          chapters: documentsRef.current,
          content: contentRef.current,
          primaryDocumentId: primaryRef.current,
        });
      }
    };
  }, [projectId]);

  return {
    documents,
    isReady,
    primaryDocumentId,
    selectedChapterId: primaryDocumentId,
    selectDocument,
    content,
    setContent,
    refreshDocuments,
    renameDocumentTitle,
    saveStatus,
    lastSavedAt,
    saveNow,
  };
}
