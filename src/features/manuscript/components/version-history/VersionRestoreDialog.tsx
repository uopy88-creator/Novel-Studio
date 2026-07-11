"use client";

/**
 * =============================================================================
 * VersionRestoreDialog — 이전 버전으로 원고 교체 확인
 * =============================================================================
 */

import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { displayVersionName } from "@/features/manuscript/types/manuscript-version";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface VersionRestoreDialogProps {
  open: boolean;
  version: ManuscriptVersion | null;
  onClose: () => void;
  onConfirm: (version: ManuscriptVersion) => void;
}

export function VersionRestoreDialog({
  open,
  version,
  onClose,
  onConfirm,
}: VersionRestoreDialogProps) {
  const label = version ? displayVersionName(version) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="이전 버전 복원"
      description={
        version
          ? `「${label}」의 내용으로 현재 원고를 바꿉니다. 자동 저장이 이어서 반영됩니다.`
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
            variant="primary"
            disabled={!version}
            onClick={() => {
              if (!version) return;
              onConfirm(version);
              onClose();
            }}
          >
            복원
          </Button>
        </>
      }
    >
      <p className="text-ns-sm text-ns-ink-secondary">
        복원 전에 현재 상태를 버전으로 저장해 두면 되돌리기 쉽습니다.
      </p>
    </Modal>
  );
}
