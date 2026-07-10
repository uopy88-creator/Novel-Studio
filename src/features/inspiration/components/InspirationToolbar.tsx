"use client";

/**
 * =============================================================================
 * InspirationToolbar — 검색 + 정렬
 * =============================================================================
 */

import type { InspirationSortMode } from "@/features/inspiration/lib/inspiration-storage";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

const SORT_OPTIONS: { value: InspirationSortMode; label: string }[] = [
  { value: "recent", label: "최근 생성순" },
  { value: "workTitle", label: "작품명순" },
];

export interface InspirationToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortMode: InspirationSortMode;
  onSortChange: (mode: InspirationSortMode) => void;
  resultCount: number;
}

export function InspirationToolbar({
  searchQuery,
  onSearchChange,
  sortMode,
  onSortChange,
  resultCount,
}: InspirationToolbarProps) {
  return (
    <div className="flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-sm">
        <Input
          label="검색"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="작품명, 메모, 선택 문장"
          hint={searchQuery.trim() ? `${resultCount}개` : undefined}
        />
      </div>
      <div className="flex flex-wrap gap-ns-2" role="group" aria-label="정렬">
        {SORT_OPTIONS.map((option) => (
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
  );
}
