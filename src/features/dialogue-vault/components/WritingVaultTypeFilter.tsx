"use client";

/**
 * =============================================================================
 * WritingVaultTypeFilter
 * -----------------------------------------------------------------------------
 * 종류별 필터: 전체 / Sentence / Word / Memo / Foreshadowing / Inspiration
 * Notion 스타일 — 텍스트 토글, 과도한 칩 장식 없음
 * =============================================================================
 */

import type { WritingVaultType } from "@/features/dialogue-vault/types/dialogue";
import {
  WRITING_VAULT_TYPE_LABELS,
  WRITING_VAULT_TYPES,
} from "@/features/dialogue-vault/types/dialogue";
import type { WritingVaultTypeFilter as TypeFilter } from "@/features/dialogue-vault/hooks/useDialogues";
import { cn } from "@/lib/utils/cn";

export interface WritingVaultTypeFilterProps {
  value: TypeFilter;
  onChange: (value: TypeFilter) => void;
  /** 종류별 개수 (선택) */
  counts?: Partial<Record<TypeFilter, number>>;
  className?: string;
}

const OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  ...WRITING_VAULT_TYPES.map((type: WritingVaultType) => ({
    value: type,
    label: WRITING_VAULT_TYPE_LABELS[type],
  })),
];

export function WritingVaultTypeFilter({
  value,
  onChange,
  counts,
  className,
}: WritingVaultTypeFilterProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-ns-1", className)}
      role="tablist"
      aria-label="Writing Vault 종류 필터"
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
