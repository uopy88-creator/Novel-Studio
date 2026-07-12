"use client";

/**
 * =============================================================================
 * ForeshadowingDeleteDialog
 * =============================================================================
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ForeshadowingDeleteDialogProps {
  open: boolean;
  foreshadowing: Foreshadowing | null;
  onClose: () => void;
  onConfirm: (foreshadowing: Foreshadowing) => void;
}

export function ForeshadowingDeleteDialog({
  open,
  foreshadowing,
  onClose,
  onConfirm,
}: ForeshadowingDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="복선 삭제"
      description={
        foreshadowing
          ? `「${foreshadowing.title}」을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
          : undefined
      }
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (!foreshadowing) return;
              onConfirm(foreshadowing);
              onClose();
            }}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className="text-ns-sm text-ns-ink-secondary">
        원고 본문은 삭제되지 않습니다. 복선 추적 기록만 제거됩니다.
      </p>
    </Modal>
  );
}
