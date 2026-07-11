"use client";

/**
 * =============================================================================
 * ProjectDeleteDialog
 * -----------------------------------------------------------------------------
 * 작품 삭제 확인.
 * 실수로 지우는 것을 막기 위해 한 번 더 묻는다.
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ProjectDeleteDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => void;
  /** 삭제 요청 중 (중복 클릭 방지) */
  confirming?: boolean;
}

export function ProjectDeleteDialog({
  open,
  project,
  onClose,
  onConfirm,
  confirming = false,
}: ProjectDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="작품을 삭제하시겠습니까?"
      description="삭제된 작품은 복구할 수 없습니다."
      size="sm"
      closeOnOverlayClick={!confirming}
      closeOnEscape={!confirming}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={confirming}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!project || confirming}
            onClick={() => {
              if (!project) return;
              onConfirm(project);
            }}
          >
            {confirming ? "삭제 중…" : "삭제"}
          </Button>
        </>
      }
    >
      {project ? (
        <p className="text-ns-sm text-ns-ink-secondary">
          「{project.title}」과(와) 연결된 Chapters, Manuscript, Characters,
          Writing Vault, Memo, Foreshadowing 등 모든 데이터가 함께 삭제됩니다.
        </p>
      ) : null}
    </Modal>
  );
}
