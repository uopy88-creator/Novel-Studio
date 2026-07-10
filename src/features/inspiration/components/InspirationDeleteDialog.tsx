"use client";

/**
 * =============================================================================
 * InspirationDeleteDialog
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface InspirationDeleteDialogProps {
  open: boolean;
  inspiration: Inspiration | null;
  onClose: () => void;
  onConfirm: (inspiration: Inspiration) => void;
}

export function InspirationDeleteDialog({
  open,
  inspiration,
  onClose,
  onConfirm,
}: InspirationDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="영감 노트 삭제"
      description={
        inspiration
          ? `「${inspiration.workTitle}」 노트를 삭제합니다.`
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
              if (!inspiration) return;
              onConfirm(inspiration);
              onClose();
            }}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className="text-ns-sm text-ns-ink-secondary">
        원고 본문은 그대로 두고, 영감 표시(💡)만 사라집니다.
      </p>
    </Modal>
  );
}
