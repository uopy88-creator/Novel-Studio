"use client";

/**
 * =============================================================================
 * SearchResultItem
 * -----------------------------------------------------------------------------
 * 검색 결과 한 행 — 제목 · 미리보기(최대 2줄) · 프로젝트명 · 하이라이트.
 * =============================================================================
 */

import type { SearchResultItem as SearchResultItemModel } from "@/features/global-search/types/search";
import { highlightQuery } from "@/features/global-search/lib/highlight";
import { cn } from "@/lib/utils/cn";

export interface SearchResultItemProps {
  item: SearchResultItemModel;
  query: string;
  active: boolean;
  index: number;
  onHover: () => void;
  onSelect: () => void;
}

export function SearchResultItem({
  item,
  query,
  active,
  index,
  onHover,
  onSelect,
}: SearchResultItemProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-search-index={index}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-ns-md px-ns-3 py-ns-2 text-left",
        active ? "bg-ns-accent-soft" : "hover:bg-ns-muted/70",
      )}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <span className="w-full truncate text-ns-sm font-medium text-ns-ink">
        {highlightQuery(item.title, query)}
      </span>
      {item.preview ? (
        <span className="line-clamp-2 w-full text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
          {highlightQuery(item.preview, query)}
        </span>
      ) : null}
      {item.projectName ? (
        <span className="w-full truncate text-ns-xs text-ns-ink-tertiary/80">
          {item.projectName}
        </span>
      ) : null}
    </button>
  );
}
