"use client";

/**
 * =============================================================================
 * ManuscriptVersionModal — 버전 목록 · 저장 · 비교 · 복원 · 이름 변경
 * -----------------------------------------------------------------------------
 * 자동 저장과 별개의 명시적 Snapshot UI.
 * =============================================================================
 */

import { useMemo, useState } from "react";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { displayVersionName } from "@/features/manuscript/types/manuscript-version";
import { VersionListItem } from "@/features/manuscript/components/version-history/VersionListItem";
import { VersionCompareView } from "@/features/manuscript/components/version-history/VersionCompareView";
import { VersionRestoreDialog } from "@/features/manuscript/components/version-history/VersionRestoreDialog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ManuscriptVersionModalProps {
  open: boolean;
  onClose: () => void;
  versions: ManuscriptVersion[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  /** 에디터의 현재 원고 (비교·저장 기준) */
  currentContent: string;
  onSaveCurrent: () => void;
  onRename: (versionId: string, name: string) => void;
  onRestore: (version: ManuscriptVersion) => void;
}

export function ManuscriptVersionModal({
  open,
  onClose,
  versions,
  isLoading,
  isSaving,
  error,
  currentContent,
  onSaveCurrent,
  onRename,
  onRestore,
}: ManuscriptVersionModalProps) {
  const [comparing, setComparing] = useState<ManuscriptVersion | null>(null);
  const [restoring, setRestoring] = useState<ManuscriptVersion | null>(null);

  const sorted = useMemo(
    () =>
      [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions],
  );

  return (
    <>
      <Modal
        open={open}
        onClose={() => {
          setComparing(null);
          onClose();
        }}
        title="버전 기록"
        description="자동 저장과 별개로, 원하는 시점의 원고를 Snapshot으로 남깁니다."
        size="lg"
        className="max-w-3xl"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSaving}
              onClick={onSaveCurrent}
            >
              {isSaving ? "저장 중…" : "현재 버전 저장"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-ns-4">
          {error ? (
            <p className="rounded-ns-lg border border-rose-200 bg-rose-50 px-ns-3 py-ns-2 text-ns-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {comparing ? (
            <div className="flex flex-col gap-ns-3">
              <div className="flex items-center justify-between gap-ns-2">
                <p className="text-ns-sm font-medium text-ns-ink">버전 비교</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setComparing(null)}
                >
                  목록으로
                </Button>
              </div>
              <VersionCompareView
                beforeLabel={displayVersionName(comparing)}
                afterLabel="현재 원고"
                beforeContent={comparing.content}
                afterContent={currentContent}
              />
            </div>
          ) : isLoading ? (
            <p className="py-ns-8 text-center text-ns-sm text-ns-ink-tertiary">
              불러오는 중…
            </p>
          ) : sorted.length === 0 ? (
            <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-4 py-ns-10 text-center">
              <p className="text-ns-sm font-medium text-ns-ink">
                저장된 버전이 없습니다
              </p>
              <p className="mt-ns-2 text-ns-xs text-ns-ink-secondary">
                「현재 버전 저장」으로 Version 1을 만들 수 있습니다.
              </p>
            </div>
          ) : (
            <ul className="flex max-h-[55vh] flex-col gap-ns-2 overflow-y-auto overscroll-contain">
              {sorted.map((version) => (
                <VersionListItem
                  key={version.id}
                  version={version}
                  onRename={onRename}
                  onCompare={setComparing}
                  onRestore={setRestoring}
                />
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <VersionRestoreDialog
        open={Boolean(restoring)}
        version={restoring}
        onClose={() => setRestoring(null)}
        onConfirm={(version) => {
          onRestore(version);
          setRestoring(null);
        }}
      />
    </>
  );
}
