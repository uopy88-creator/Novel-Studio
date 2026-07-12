"use client";

/**
 * =============================================================================
 * ForeshadowingToolbar — 상태 필터 + 검색 + 정렬
 * =============================================================================
 */

import { ForeshadowingStatusFilter } from "@/features/foreshadowing/components/ForeshadowingStatusFilter";
import {
  FORESHADOWING_SORT_OPTIONS,
  type ForeshadowingSortMode,
  type ForeshadowingStatusFilter as StatusFilter,
} from "@/features/foreshadowing/lib/foreshadowing-service";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface ForeshadowingToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  statusCounts?: Partial<Record<StatusFilter, number>>;
  sortMode: ForeshadowingSortMode;
  onSortChange: (mode: ForeshadowingSortMode) => void;
  resultCount: number;
}

export function ForeshadowingToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  sortMode,
  onSortChange,
  resultCount,
}: ForeshadowingToolbarProps) {
  return (
    <div className="flex flex-col gap-ns-4">
      {/* 상태 필터 */}
      <ForeshadowingStatusFilter
        value={statusFilter}
        onChange={onStatusFilterChange}
        counts={statusCounts}
      />

      {/* 검색 + 정렬 */}
      <div className="flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <Input
            label="검색"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="제목·설명으로 검색"
            hint={searchQuery.trim() ? `${resultCount}건` : undefined}
          />
        </div>
        <div className="flex flex-wrap gap-ns-2" role="group" aria-label="정렬">
          {FORESHADOWING_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSortChange(option.value)}
              className={cn(
                "min-h-10 rounded-ns-full px-ns-4 text-ns-sm font-medium transition-colors",
                sortMode === option.value
                  ? "bg-ns-accent text-ns-ink-inverse"
                  : "bg-ns-muted text-ns-ink-secondary hover:bg-ns-border",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
