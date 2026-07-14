"use client";

/**
 * =============================================================================
 * useAutoRecovery
 * -----------------------------------------------------------------------------
 * - 내용 변경 후 debounce(10초) 로 LocalStorage Recovery Draft 저장
 * - Autosave(Supabase) 와 완전히 분리
 * - Document 로드 시 Recovery 가 저장본보다 최신이면 복구 다이얼로그
 * - 정상 저장 성공 시 Recovery 자동 삭제
 * =============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecoveryOffer } from "@/features/manuscript/types/manuscript-recovery";
import type { ChapterId, ProjectId } from "@/types/ids";
import type { SaveStatus } from "@/features/manuscript/hooks/useManuscript";
import {
  clearRecoveryDraft,
  getRecoveryDraft,
  isRecoveryNewerThanSaved,
  recoveryDiffersFromSaved,
  writeRecoveryDraft,
} from "@/features/manuscript/lib/manuscript-recovery-storage";

/** 내용 변경 후 Recovery 기록 debounce (입력 성능 유지) */
const RECOVERY_DEBOUNCE_MS = 10_000;

export interface UseAutoRecoveryParams {
  projectId: ProjectId;
  chapterId: ChapterId | null;
  content: string;
  setContent: (value: string) => void;
  saveStatus: SaveStatus;
  /** 마지막 정상 저장 시각 — Recovery 최신 여부 판단 */
  lastSavedAt?: string | null;
}

export interface UseAutoRecoveryResult {
  offer: RecoveryOffer | null;
  showDiff: boolean;
  setShowDiff: (open: boolean) => void;
  acceptRecovery: () => void;
  /** Recovery Storage 삭제 후 저장본 유지 */
  discardRecovery: () => void;
  /** 다이얼로그만 닫기 — Recovery 는 유지 */
  dismissRecovery: () => void;
}

export function useAutoRecovery({
  projectId,
  chapterId,
  content,
  setContent,
  saveStatus,
  lastSavedAt = null,
}: UseAutoRecoveryParams): UseAutoRecoveryResult {
  const [offer, setOffer] = useState<RecoveryOffer | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const contentRef = useRef(content);
  const chapterRef = useRef(chapterId);
  const offerRef = useRef(offer);
  const checkedChapterRef = useRef<ChapterId | null>(null);
  /** 마지막 클라우드/로드 저장본 — 이와 같을 때는 임시 초안을 쓰지 않음 */
  const savedBaselineRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  contentRef.current = content;
  chapterRef.current = chapterId;
  offerRef.current = offer;

  // —— Document 로드 후: Recovery 가 저장본보다 최신·다르면 제안 ——
  useEffect(() => {
    if (!chapterId) {
      checkedChapterRef.current = null;
      setOffer(null);
      setShowDiff(false);
      return;
    }

    if (saveStatus === "dirty" || saveStatus === "saving") return;
    if (checkedChapterRef.current === chapterId) return;
    checkedChapterRef.current = chapterId;
    savedBaselineRef.current = content;

    const draft = getRecoveryDraft(projectId, chapterId);
    if (!draft) {
      setOffer(null);
      return;
    }

    const differs = recoveryDiffersFromSaved(draft.content, content);
    const newer = isRecoveryNewerThanSaved(draft.updatedAt, lastSavedAt);

    if (!differs || !newer) {
      // 저장본과 같거나 더 오래된 초안 → 정리
      if (!differs) {
        clearRecoveryDraft(projectId, chapterId);
      }
      setOffer(null);
      return;
    }

    setShowDiff(false);
    setOffer({ draft, savedContent: content });
  }, [projectId, chapterId, content, saveStatus, lastSavedAt]);

  // —— 정상 저장 성공 → Recovery 자동 삭제 ——
  useEffect(() => {
    if (!chapterId) return;
    if (saveStatus !== "saved") return;
    if (offerRef.current) return;

    savedBaselineRef.current = content;
    clearRecoveryDraft(projectId, chapterId);
  }, [saveStatus, projectId, chapterId, content]);

  const flushRecovery = useCallback(() => {
    const id = chapterRef.current;
    if (!id) return;
    if (offerRef.current) return;
    if (contentRef.current === savedBaselineRef.current) return;

    writeRecoveryDraft({
      projectId,
      chapterId: id,
      content: contentRef.current,
    });
  }, [projectId]);

  // —— 내용 변경 debounce(10초) — Editor 렌더와 분리 (ref + timer) ——
  useEffect(() => {
    if (!chapterId) return;
    if (offer) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      flushRecovery();
    }, RECOVERY_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [chapterId, content, flushRecovery, offer]);

  // —— 탭 숨김·종료 직전 즉시 기록 ——
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        flushRecovery();
      }
    };
    const onPageHide = () => {
      flushRecovery();
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushRecovery]);

  const acceptRecovery = useCallback(() => {
    const current = offerRef.current;
    if (!current || !chapterId) return;

    const recovered = current.draft.content;
    clearRecoveryDraft(projectId, chapterId);
    setOffer(null);
    setShowDiff(false);
    setContent(recovered);
    checkedChapterRef.current = chapterId;
  }, [chapterId, projectId, setContent]);

  const discardRecovery = useCallback(() => {
    if (!chapterId) return;
    clearRecoveryDraft(projectId, chapterId);
    setOffer(null);
    setShowDiff(false);
    checkedChapterRef.current = chapterId;
  }, [chapterId, projectId]);

  const dismissRecovery = useCallback(() => {
    // 취소 — Recovery 유지, 다이얼로그만 닫음
    setOffer(null);
    setShowDiff(false);
    if (chapterId) {
      checkedChapterRef.current = chapterId;
    }
  }, [chapterId]);

  return {
    offer,
    showDiff,
    setShowDiff,
    acceptRecovery,
    discardRecovery,
    dismissRecovery,
  };
}
