"use client";

/**
 * =============================================================================
 * useAutoRecovery
 * -----------------------------------------------------------------------------
 * - 30초마다 LocalStorage 에 임시 초안 저장 (Supabase 미사용)
 * - Document 로드 시 저장본과 다르면 복원 제안
 * - 팝업이 떠 있는 동안은 임시 저장을 잠시 멈춤
 * =============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecoveryOffer } from "@/features/manuscript/types/manuscript-recovery";
import type { ChapterId, ProjectId } from "@/types/ids";
import type { SaveStatus } from "@/features/manuscript/hooks/useManuscript";
import {
  clearRecoveryDraft,
  getRecoveryDraft,
  recoveryDiffersFromSaved,
  writeRecoveryDraft,
} from "@/features/manuscript/lib/manuscript-recovery-storage";

/** 임시 저장 주기 (요구사항: 30초) */
const RECOVERY_INTERVAL_MS = 30_000;

export interface UseAutoRecoveryParams {
  projectId: ProjectId;
  chapterId: ChapterId | null;
  content: string;
  setContent: (value: string) => void;
  saveStatus: SaveStatus;
}

export interface UseAutoRecoveryResult {
  /** 복원 제안이 있으면 팝업 표시 */
  offer: RecoveryOffer | null;
  /** 차이점 미리보기 펼침 */
  showDiff: boolean;
  setShowDiff: (open: boolean) => void;
  /** 복구 초안으로 에디터 교체 → 이후 기존 자동 저장이 클라우드에 반영 */
  acceptRecovery: () => void;
  /** 복구 초안 삭제 */
  discardRecovery: () => void;
}

export function useAutoRecovery({
  projectId,
  chapterId,
  content,
  setContent,
  saveStatus,
}: UseAutoRecoveryParams): UseAutoRecoveryResult {
  const [offer, setOffer] = useState<RecoveryOffer | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const contentRef = useRef(content);
  const chapterRef = useRef(chapterId);
  const offerRef = useRef(offer);
  const checkedChapterRef = useRef<ChapterId | null>(null);
  /** 마지막 클라우드/로드 저장본 — 이와 같을 때는 임시 초안을 쓰지 않음 */
  const savedBaselineRef = useRef<string>("");

  contentRef.current = content;
  chapterRef.current = chapterId;
  offerRef.current = offer;

  // —— Document 로드 후: 복구 초안 vs 마지막 저장본 비교 ——
  useEffect(() => {
    if (!chapterId) {
      checkedChapterRef.current = null;
      setOffer(null);
      setShowDiff(false);
      return;
    }

    // loadDocument 가 chapterId·content·idle 을 한 번에 세팅할 때까지 대기
    if (saveStatus === "dirty" || saveStatus === "saving") return;
    if (checkedChapterRef.current === chapterId) return;
    checkedChapterRef.current = chapterId;
    savedBaselineRef.current = content;

    const draft = getRecoveryDraft(projectId, chapterId);
    if (!draft) {
      setOffer(null);
      return;
    }

    if (!recoveryDiffersFromSaved(draft.content, content)) {
      // 저장본과 동일 → 불필요한 초안 정리
      clearRecoveryDraft(projectId, chapterId);
      setOffer(null);
      return;
    }

    setShowDiff(false);
    setOffer({ draft, savedContent: content });
  }, [projectId, chapterId, content, saveStatus]);

  // —— 클라우드 저장 성공 후: baseline 갱신 · 동일 초안 삭제 ——
  useEffect(() => {
    if (!chapterId) return;
    if (saveStatus !== "saved") return;
    if (offerRef.current) return; // 복원 결정 전에는 건드리지 않음

    savedBaselineRef.current = content;
    const draft = getRecoveryDraft(projectId, chapterId);
    if (draft && !recoveryDiffersFromSaved(draft.content, content)) {
      clearRecoveryDraft(projectId, chapterId);
    }
  }, [saveStatus, projectId, chapterId, content]);

  const flushRecovery = useCallback(() => {
    const id = chapterRef.current;
    if (!id) return;
    // 복원 팝업이 열려 있으면 덮어쓰지 않음 (저장본 기준 비교 유지)
    if (offerRef.current) return;
    // 마지막 저장본과 같으면 임시 초안 불필요
    if (contentRef.current === savedBaselineRef.current) return;

    writeRecoveryDraft({
      projectId,
      chapterId: id,
      content: contentRef.current,
    });
  }, [projectId]);

  // —— 30초 주기 임시 저장 ——
  useEffect(() => {
    if (!chapterId) return;

    const timer = window.setInterval(() => {
      flushRecovery();
    }, RECOVERY_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [chapterId, flushRecovery]);

  // —— 탭 숨김·종료 직전에도 한 번 기록 (브라우저 종료 대비) ——
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
    // 에디터 반영 → useManuscript 800ms 자동 저장이 Supabase 에 올림
    setContent(recovered);
    // 같은 문서에서 재제안되지 않도록 체크 유지
    checkedChapterRef.current = chapterId;
  }, [chapterId, projectId, setContent]);

  const discardRecovery = useCallback(() => {
    if (!chapterId) return;
    clearRecoveryDraft(projectId, chapterId);
    setOffer(null);
    setShowDiff(false);
    checkedChapterRef.current = chapterId;
  }, [chapterId, projectId]);

  return {
    offer,
    showDiff,
    setShowDiff,
    acceptRecovery,
    discardRecovery,
  };
}
