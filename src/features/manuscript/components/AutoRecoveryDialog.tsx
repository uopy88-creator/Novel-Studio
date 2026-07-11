"use client";

/**
 * =============================================================================
 * AutoRecoveryDialog
 * -----------------------------------------------------------------------------
 * 자동 저장본(클라우드) ≠ 로컬 복구 초안 일 때
 * 「복원하시겠습니까?」 + 차이점 미리보기
 * =============================================================================
 */

import type { RecoveryOffer } from "@/features/manuscript/types/manuscript-recovery";
import { VersionCompareView } from "@/features/manuscript/components/version-history/VersionCompareView";
import { formatShortDate, formatShortTime } from "@/lib/format-date";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface AutoRecoveryDialogProps {
  offer: RecoveryOffer | null;
  showDiff: boolean;
  onToggleDiff: () => void;
  onAccept: () => void;
  onDiscard: () => void;
}

export function AutoRecoveryDialog({
  offer,
  showDiff,
  onToggleDiff,
  onAccept,
  onDiscard,
}: AutoRecoveryDialogProps) {
  const open = Boolean(offer);
  const savedAtLabel = offer
    ? `${formatShortDate(offer.draft.updatedAt)} ${formatShortTime(offer.draft.updatedAt)}`
    : "";

  return (
    <Modal
      open={open}
      onClose={onDiscard}
      title="복원하시겠습니까?"
      description={
        offer
          ? `브라우저에 남은 임시 초안이 마지막 저장본과 다릅니다. (${savedAtLabel})`
          : undefined
      }
      size="lg"
      className="max-w-3xl"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onDiscard}>
            복원하지 않음
          </Button>
          <Button type="button" variant="primary" onClick={onAccept}>
            복원
          </Button>
        </>
      }
    >
      {offer ? (
        <div className="flex flex-col gap-ns-4">
          <p className="text-ns-sm text-ns-ink-secondary">
            임시 초안은 이 기기의 브라우저에만 있습니다. 복원하지 않으면
            초안을 삭제합니다. (Supabase 저장본은 그대로 둡니다.)
          </p>

          <div className="flex flex-wrap gap-ns-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onToggleDiff}
            >
              {showDiff ? "차이점 숨기기" : "차이점 미리보기"}
            </Button>
          </div>

          {showDiff ? (
            <VersionCompareView
              beforeLabel="마지막 저장본"
              afterLabel="복구 초안"
              beforeContent={offer.savedContent}
              afterContent={offer.draft.content}
            />
          ) : (
            <div className="rounded-ns-lg border border-ns-border bg-ns-muted/40 px-ns-4 py-ns-3 text-ns-xs text-ns-ink-secondary">
              <p>
                저장본 {offer.savedContent.length.toLocaleString()}자 · 복구
                초안 {offer.draft.content.length.toLocaleString()}자
              </p>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
