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
}

export function ProjectDeleteDialog({
  open,
  project,
  onClose,
  onConfirm,
}: ProjectDeleteDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="작품 삭제"
      description={
        project
          ? `「${project.title}」을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
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
            disabled={!project}
            onClick={() => {
              if (!project) return;
              onConfirm(project);
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
