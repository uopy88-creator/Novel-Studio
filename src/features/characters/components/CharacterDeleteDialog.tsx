"use client";

/**
 * =============================================================================
 * CharacterDeleteDialog
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface CharacterDeleteDialogProps {
  open: boolean;
  character: Character | null;
  onClose: () => void;
  onConfirm: (character: Character) => void;
}

export function CharacterDeleteDialog({
  open,
  character,
  onClose,
  onConfirm,
}: CharacterDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="인물 삭제"
      description={
        character
          ? `「${character.name}」 프로필을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
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
              if (!character) return;
              onConfirm(character);
              onClose();
            }}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className="text-ns-sm text-ns-ink-secondary">
        원고에 적어 둔 @멘션 텍스트는 그대로 남습니다.
      </p>
    </Modal>
  );
}
