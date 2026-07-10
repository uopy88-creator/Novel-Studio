"use client";

/**
 * =============================================================================
 * useManuscript
 * -----------------------------------------------------------------------------
 * Document 원고 편집 — Cloud(DB) 우선 자동 저장, LocalStorage 백업.
 * =============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import {
  getManuscriptByChapterId,
  saveManuscriptContent,
  touchManuscriptOpened,
} from "@/features/manuscript/lib/manuscript-storage";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 800;

export interface UseManuscriptResult {
  documents: Chapter[];
  isReady: boolean;
  selectedChapterId: ChapterId | null;
  selectDocument: (chapterId: ChapterId) => void;
  content: string;
  setContent: (value: string) => void;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveNow: () => void;
}

export function useManuscript(
  projectId: ProjectId,
  initialDocumentId?: ChapterId | null,
): UseManuscriptResult {
  const [documents, setDocuments] = useState<Chapter[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<ChapterId | null>(
    null,
  );
  const [content, setContentState] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const contentRef = useRef(content);
  const selectedRef = useRef(selectedChapterId);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didApplyInitial = useRef(false);

  contentRef.current = content;
  selectedRef.current = selectedChapterId;

  const loadDocument = useCallback(
    async (chapterId: ChapterId) => {
      const existing = await getManuscriptByChapterId(projectId, chapterId);
      dirtyRef.current = false;
      setSelectedChapterId(chapterId);
      setContentState(existing?.content ?? "");
      setSaveStatus("idle");
      setLastSavedAt(existing?.updatedAt ?? null);
      void touchManuscriptOpened(projectId, chapterId);
    },
    [projectId],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await readChaptersByProject(projectId);
      if (cancelled) return;
      setDocuments(list);
      setIsReady(true);

      if (
        !didApplyInitial.current &&
        initialDocumentId &&
        list.some((document) => document.id === initialDocumentId)
      ) {
        didApplyInitial.current = true;
        await loadDocument(initialDocumentId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, initialDocumentId, loadDocument]);

  const persist = useCallback(
    (chapterId: ChapterId, value: string) => {
      setSaveStatus("saving");
      void (async () => {
        try {
          const saved = await saveManuscriptContent({
            projectId,
            chapterId,
            content: value,
          });
          dirtyRef.current = false;
          setLastSavedAt(saved.updatedAt);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      })();
    },
    [projectId],
  );

  const saveNow = useCallback(() => {
    if (!selectedRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    persist(selectedRef.current, contentRef.current);
  }, [persist]);

  const selectDocument = useCallback(
    (chapterId: ChapterId) => {
      if (selectedRef.current && dirtyRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        persist(selectedRef.current, contentRef.current);
      }
      void loadDocument(chapterId);
    },
    [loadDocument, persist],
  );

  const setContent = useCallback(
    (value: string) => {
      setContentState(value);
      dirtyRef.current = true;
      setSaveStatus("dirty");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!selectedRef.current) return;
        persist(selectedRef.current, value);
      }, AUTOSAVE_MS);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (selectedRef.current && dirtyRef.current) {
        void saveManuscriptContent({
          projectId,
          chapterId: selectedRef.current,
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
    saveStatus,
    lastSavedAt,
    saveNow,
  };
}
