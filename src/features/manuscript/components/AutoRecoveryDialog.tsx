"use client";

/**
 * =============================================================================
 * AutoRecoveryDialog
 * -----------------------------------------------------------------------------
 * Recovery Draft 가 저장본보다 최신일 때 복구 여부를 묻는다.
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
  /** 복구 — Editor 에 Recovery 적용 */
  onAccept: () => void;
  /** 삭제 — Recovery Storage 삭제 */
  onDiscard: () => void;
  /** 취소 — 다이얼로그만 닫고 Recovery 유지 */
  onCancel: () => void;
}

export function AutoRecoveryDialog({
  offer,
  showDiff,
  onToggleDiff,
  onAccept,
  onDiscard,
  onCancel,
}: AutoRecoveryDialogProps) {
  const open = Boolean(offer);
  const savedAtLabel = offer
    ? `${formatShortDate(offer.draft.updatedAt)} ${formatShortTime(offer.draft.updatedAt)}`
    : "";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="복구 가능한 임시 저장본을 발견했습니다."
      description={
        offer
          ? `최근 작업이 저장되지 않았을 수 있습니다. (${savedAtLabel})`
          : undefined
      }
      size="lg"
      className="max-w-3xl"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" variant="secondary" onClick={onDiscard}>
            삭제
          </Button>
          <Button type="button" variant="primary" onClick={onAccept}>
            복구
          </Button>
        </>
      }
    >
      {offer ? (
        <div className="flex flex-col gap-ns-4">
          <p className="text-ns-sm text-ns-ink-secondary">
            복구하시겠습니까? 임시 초안은 이 기기 브라우저에만 있습니다.
            「삭제」하면 초안을 지우고 저장본을 그대로 씁니다.
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
