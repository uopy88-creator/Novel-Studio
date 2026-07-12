"use client";

/**
 * =============================================================================
 * useManuscriptHistory
 * -----------------------------------------------------------------------------
 * useManuscript 의 setContent 를 Undo/Redo 가능한 setter 로 감싼다.
 * 프로젝트 세션 히스토리를 Manuscript ↔ Section 페이지가 공유한다.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { ProjectId } from "@/types/ids";
import {
  canRedoManuscript,
  canUndoManuscript,
  ensureManuscriptHistorySeed,
  getManuscriptHistoryPresent,
  isManuscriptHistoryInitialized,
  recordManuscriptEdit,
  recordManuscriptTransaction,
  redoManuscript,
  resetManuscriptHistory,
  runWithoutManuscriptHistory,
  subscribeManuscriptHistory,
  undoManuscript,
} from "@/features/manuscript/lib/manuscript-edit-history";

export interface UseManuscriptHistoryResult {
  /** 타이핑·삭제·붙여넣기 (묶음 기록) */
  setContent: (value: string) => void;
  /** Section 생성·이동·삭제 등 (즉시 한 단계) */
  setContentTransactional: (value: string) => void;
  /** 로드·버전 복원 등 (히스토리 초기화) */
  replaceContent: (value: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useManuscriptHistory(
  projectId: ProjectId,
  content: string,
  baseSetContent: (value: string) => void,
  isReady: boolean,
): UseManuscriptHistoryResult {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(canUndoManuscript(projectId));
    setCanRedo(canRedoManuscript(projectId));
  }, [projectId]);

  useEffect(() => {
    return subscribeManuscriptHistory(projectId, syncFlags);
  }, [projectId, syncFlags]);

  // 프로젝트당 1회 시드. 이미 세션이 있으면 React state 를 세션 present 에 맞춘다.
  useEffect(() => {
    if (!isReady) return;

    if (!isManuscriptHistoryInitialized(projectId)) {
      ensureManuscriptHistorySeed(projectId, content);
    } else {
      const present = getManuscriptHistoryPresent(projectId);
      if (present !== content) {
        runWithoutManuscriptHistory(projectId, () => {
          baseSetContent(present);
        });
      }
    }
    syncFlags();
    // content / baseSetContent 는 의도적으로 제외 — 페이지 진입 시에만 동기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, projectId]);

  const setContent = useCallback(
    (value: string) => {
      recordManuscriptEdit(projectId, value);
      baseSetContent(value);
      syncFlags();
    },
    [projectId, baseSetContent, syncFlags],
  );

  const setContentTransactional = useCallback(
    (value: string) => {
      recordManuscriptTransaction(projectId, value);
      baseSetContent(value);
      syncFlags();
    },
    [projectId, baseSetContent, syncFlags],
  );

  const replaceContent = useCallback(
    (value: string) => {
      runWithoutManuscriptHistory(projectId, () => {
        baseSetContent(value);
      });
      resetManuscriptHistory(projectId, value);
      syncFlags();
    },
    [projectId, baseSetContent, syncFlags],
  );

  const undo = useCallback(() => {
    const snapshot = undoManuscript(projectId);
    if (!snapshot) return;
    runWithoutManuscriptHistory(projectId, () => {
      baseSetContent(snapshot.content);
    });
    syncFlags();
  }, [projectId, baseSetContent, syncFlags]);

  const redo = useCallback(() => {
    const snapshot = redoManuscript(projectId);
    if (!snapshot) return;
    runWithoutManuscriptHistory(projectId, () => {
      baseSetContent(snapshot.content);
    });
    syncFlags();
  }, [projectId, baseSetContent, syncFlags]);

  return {
    setContent,
    setContentTransactional,
    replaceContent,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
