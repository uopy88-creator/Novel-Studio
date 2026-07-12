"use client";

/**
 * =============================================================================
 * ForeshadowingStatusFilter
 * -----------------------------------------------------------------------------
 * 전체 / 심음 / 회수 예정 / 회수 완료
 * Writing Vault 타입 필터와 같은 Notion 스타일 탭.
 * =============================================================================
 */

import {
  FORESHADOWING_STATUSES,
  FORESHADOWING_STATUS_LABELS,
} from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingStatusFilter as StatusFilter } from "@/features/foreshadowing/lib/foreshadowing-service";
import { cn } from "@/lib/utils/cn";

export interface ForeshadowingStatusFilterProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  /** 상태별 개수 (선택) */
  counts?: Partial<Record<StatusFilter, number>>;
  className?: string;
}

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  ...FORESHADOWING_STATUSES.map((status) => ({
    value: status as StatusFilter,
    label: FORESHADOWING_STATUS_LABELS[status],
  })),
];

export function ForeshadowingStatusFilter({
  value,
  onChange,
  counts,
  className,
}: ForeshadowingStatusFilterProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-ns-1", className)}
      role="tablist"
      aria-label="복선 상태 필터"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        const count = counts?.[option.value];
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 rounded-ns-md px-ns-3 text-ns-sm font-medium transition-colors",
              active
                ? "bg-ns-muted text-ns-ink"
                : "text-ns-ink-tertiary hover:bg-ns-muted/60 hover:text-ns-ink",
            )}
          >
            {option.label}
            {typeof count === "number" ? (
              <span className="ml-1 tabular-nums text-ns-ink-tertiary">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
