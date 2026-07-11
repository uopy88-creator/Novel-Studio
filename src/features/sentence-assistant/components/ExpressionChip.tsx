"use client";

/**
 * =============================================================================
 * ExpressionChip — 클릭 시 클립보드 복사만 (원고 수정 없음)
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface ExpressionChipProps {
  label: string;
  onCopy: (text: string) => void;
}

export function ExpressionChip({ label, onCopy }: ExpressionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onCopy(label)}
      title="클립보드에 복사"
      className={cn(
        "inline-flex max-w-full items-center rounded-ns-md border border-ns-border",
        "bg-ns-surface px-ns-3 py-ns-2 text-left text-ns-sm text-ns-ink",
        "hover:border-ns-border-strong hover:bg-ns-muted",
        "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
