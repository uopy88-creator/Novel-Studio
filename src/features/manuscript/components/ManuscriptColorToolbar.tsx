"use client";

/**
 * =============================================================================
 * ManuscriptColorToolbar
 * -----------------------------------------------------------------------------
 * 집필 중 「표시용」 텍스트 색상 — 장식용 컬러 피커가 아니다.
 * 지원 색: 검정(기본)·파랑·빨강·노랑. 원형 아이콘만 표시.
 * =============================================================================
 */

import {
  MANUSCRIPT_FG_COLORS,
  MANUSCRIPT_FG_CSS,
  MANUSCRIPT_FG_LABELS,
  type ManuscriptFgColor,
} from "@/features/manuscript/lib/manuscript-markup";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptColorToolbarProps {
  /** 현재 선택 구간의 통일 색 (없으면 테두리 없음) */
  activeColor: ManuscriptFgColor | null;
  disabled?: boolean;
  onSelect: (color: ManuscriptFgColor) => void;
  className?: string;
}

export function ManuscriptColorToolbar({
  activeColor,
  disabled,
  onSelect,
  className,
}: ManuscriptColorToolbarProps) {
  return (
    <div
      className={cn("flex items-center gap-ns-1", className)}
      role="group"
      aria-label="텍스트 색상"
    >
      {MANUSCRIPT_FG_COLORS.map((color) => {
        const selected = activeColor === color;
        return (
          <button
            key={color}
            type="button"
            disabled={disabled}
            title={
              color === "k"
                ? `${MANUSCRIPT_FG_LABELS[color]} (기본)`
                : MANUSCRIPT_FG_LABELS[color]
            }
            aria-label={MANUSCRIPT_FG_LABELS[color]}
            aria-pressed={selected}
            onClick={() => onSelect(color)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full",
              "transition-colors hover:bg-ns-muted",
              "disabled:cursor-not-allowed disabled:opacity-40",
              "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
            )}
          >
            <span
              className={cn(
                "block h-3.5 w-3.5 rounded-full border-2",
                selected ? "border-ns-accent" : "border-ns-border-strong",
              )}
              style={{ backgroundColor: MANUSCRIPT_FG_CSS[color] }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
