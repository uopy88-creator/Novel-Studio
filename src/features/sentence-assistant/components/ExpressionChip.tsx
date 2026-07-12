"use client";

/**
 * =============================================================================
 * ExpressionChip — 클릭 시 선택 단어를 해당 유의어로 교체
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface ExpressionChipProps {
  label: string;
  onSelect: (text: string) => void;
}

export function ExpressionChip({ label, onSelect }: ExpressionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(label)}
      title={`${label}(으)로 바꾸기`}
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
