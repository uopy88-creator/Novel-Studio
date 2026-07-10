"use client";

/**
 * =============================================================================
 * CharacterToolbar — 검색 + 정렬
 * =============================================================================
 */

import type { CharacterSortMode } from "@/features/characters/lib/character-storage";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

const SORT_OPTIONS: { value: CharacterSortMode; label: string }[] = [
  { value: "favorite", label: "즐겨찾기 우선" },
  { value: "name", label: "이름순" },
  { value: "updated", label: "최근 수정순" },
];

export interface CharacterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortMode: CharacterSortMode;
  onSortChange: (mode: CharacterSortMode) => void;
  resultCount: number;
}

export function CharacterToolbar({
  searchQuery,
  onSearchChange,
  sortMode,
  onSortChange,
  resultCount,
}: CharacterToolbarProps) {
  return (
    <div className="flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-sm">
        <Input
          label="검색"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="이름으로 검색"
          hint={searchQuery.trim() ? `${resultCount}명` : undefined}
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
