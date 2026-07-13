"use client";

/**
 * =============================================================================
 * MemoDeleteDialog
 * =============================================================================
 */

import type { Memo } from "@/features/memo/types/memo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface MemoDeleteDialogProps {
  open: boolean;
  memo: Memo | null;
  onClose: () => void;
  onConfirm: (memo: Memo) => void;
}

export function MemoDeleteDialog({
  open,
  memo,
  onClose,
  onConfirm,
}: MemoDeleteDialogProps) {
  const preview = memo?.body.trim().slice(0, 40) ?? "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Memo 삭제"
      description={
        preview ? `「${preview}${memo && memo.body.length > 40 ? "…" : ""}」` : undefined
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
              if (!memo) return;
              onConfirm(memo);
              onClose();
            }}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className="text-ns-sm text-ns-ink-secondary">
        삭제한 Memo는 되돌릴 수 없습니다.
      </p>
    </Modal>
  );
}
