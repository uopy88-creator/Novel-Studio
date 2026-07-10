"use client";

/**
 * =============================================================================
 * DocumentDeleteDialog
 * -----------------------------------------------------------------------------
 * Document 삭제 확인.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface DocumentDeleteDialogProps {
  open: boolean;
  document: Chapter | null;
  onClose: () => void;
  onConfirm: (document: Chapter) => void;
}

export function DocumentDeleteDialog({
  open,
  document,
  onClose,
  onConfirm,
}: DocumentDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Document 삭제"
      description={
        document
          ? `「${document.title}」을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
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
            disabled={!document}
            onClick={() => {
              if (!document) return;
              onConfirm(document);
              onClose();
            }}
          >
            삭제
          </Button>
        </>
      }
    />
  );
}
