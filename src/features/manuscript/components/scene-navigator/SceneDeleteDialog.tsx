"use client";

/**
 * =============================================================================
 * SceneDeleteDialog
 * -----------------------------------------------------------------------------
 * Scene 삭제 확인 — 두 가지 방식 중 선택
 * 1) full: 구분자 + 본문 전체 삭제
 * 2) delimiter-only: 구분자만 삭제, 본문은 인접 Scene에 병합
 * =============================================================================
 */

import { useEffect, useState } from "react";
import type { Scene } from "@/features/manuscript/types/scene";
import type { SceneDeleteMode } from "@/features/manuscript/lib/scene-operations";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface SceneDeleteDialogProps {
  open: boolean;
  scene: Scene | null;
  onClose: () => void;
  onConfirm: (scene: Scene, mode: SceneDeleteMode) => void;
}

export function SceneDeleteDialog({
  open,
  scene,
  onClose,
  onConfirm,
}: SceneDeleteDialogProps) {
  const [mode, setMode] = useState<SceneDeleteMode>("full");

  useEffect(() => {
    if (open) setMode("full");
  }, [open, scene?.id]);

  const label = scene
    ? `#${scene.number}${scene.title.trim() ? ` ${scene.title.trim()}` : ""}`
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scene 삭제"
      description={
        scene
          ? `「${label}」을(를) 어떻게 삭제할까요?`
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
            disabled={!scene}
            onClick={() => {
              if (!scene) return;
              onConfirm(scene, mode);
              onClose();
              setMode("full");
            }}
          >
            삭제
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-ns-3" role="radiogroup" aria-label="삭제 방식">
        <ModeOption
          active={mode === "full"}
          onSelect={() => setMode("full")}
          title="Scene 전체 삭제"
          description="구분자와 본문을 모두 원고에서 제거합니다."
        />
        <ModeOption
          active={mode === "delimiter-only"}
          onSelect={() => setMode("delimiter-only")}
          title="구분자만 삭제"
          description="본문은 남기고 #N 줄만 제거합니다. 내용은 인접 Scene에 합쳐집니다."
        />
      </div>
    </Modal>
  );
}

function ModeOption({
  active,
  onSelect,
  title,
  description,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "rounded-ns-md border px-ns-4 py-ns-3 text-left transition-colors",
        active
          ? "border-ns-accent-border bg-ns-accent-soft"
          : "border-ns-border hover:bg-ns-muted/50",
      )}
    >
      <span className="block text-ns-sm font-medium text-ns-ink">{title}</span>
      <span className="mt-ns-1 block text-ns-xs leading-ns-relaxed text-ns-ink-secondary">
        {description}
      </span>
    </button>
  );
}
