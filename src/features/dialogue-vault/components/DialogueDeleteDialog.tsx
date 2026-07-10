"use client";

/**
 * =============================================================================
 * DialogueDeleteDialog
 * -----------------------------------------------------------------------------
 * 대사 삭제 확인.
 * =============================================================================
 */

import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface DialogueDeleteDialogProps {
  open: boolean;
  dialogue: Dialogue | null;
  onClose: () => void;
  onConfirm: (dialogue: Dialogue) => void;
}

export function DialogueDeleteDialog({
  open,
  dialogue,
  onClose,
  onConfirm,
}: DialogueDeleteDialogProps) {
  const preview = dialogue
    ? dialogue.content.length > 40
      ? `${dialogue.content.slice(0, 40)}…`
      : dialogue.content
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="대사 삭제"
      description={
        dialogue
          ? `「${preview}」을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
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
            disabled={!dialogue}
            onClick={() => {
              if (!dialogue) return;
              onConfirm(dialogue);
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
