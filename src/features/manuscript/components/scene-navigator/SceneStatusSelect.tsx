"use client";

/**
 * =============================================================================
 * SceneStatusSelect — 초안 / 수정중 / 완료
 * -----------------------------------------------------------------------------
 * 색은 회색·파랑·초록만 사용 (Notion 스타일 미니멀)
 * =============================================================================
 */

import type { SceneStatus } from "@/features/manuscript/types/scene";
import { SCENE_STATUS_LABELS } from "@/features/manuscript/types/scene";
import { cn } from "@/lib/utils/cn";

const STATUS_ORDER: SceneStatus[] = ["draft", "editing", "done"];

/** 상태별 점·칩 색 (최소한) */
const STATUS_DOT: Record<SceneStatus, string> = {
  draft: "bg-neutral-400",
  editing: "bg-blue-500",
  done: "bg-emerald-500",
};

const STATUS_CHIP: Record<SceneStatus, string> = {
  draft: "text-neutral-600",
  editing: "text-blue-600",
  done: "text-emerald-600",
};

export interface SceneStatusSelectProps {
  value: SceneStatus;
  onChange: (status: SceneStatus) => void;
  className?: string;
}

export function SceneStatusSelect({
  value,
  onChange,
  className,
}: SceneStatusSelectProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-ns-1", className)}
      role="group"
      aria-label="Scene 상태"
    >
      {STATUS_ORDER.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(status);
            }}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-ns-md px-ns-2 py-0.5",
              "text-ns-xs font-medium transition-colors",
              active
                ? cn("bg-ns-muted", STATUS_CHIP[status])
                : "text-ns-ink-tertiary hover:bg-ns-muted/60 hover:text-ns-ink-secondary",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                STATUS_DOT[status],
                !active && "opacity-40",
              )}
            />
            {SCENE_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

/** Navigator 행 왼쪽 상태 점 */
export function SceneStatusDot({
  status,
  className,
}: {
  status: SceneStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      title={SCENE_STATUS_LABELS[status]}
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        STATUS_DOT[status],
        className,
      )}
    />
  );
}
