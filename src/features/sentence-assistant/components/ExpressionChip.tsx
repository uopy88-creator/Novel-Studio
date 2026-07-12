"use client";

/**
 * =============================================================================
 * ExpressionChip — 유의어 선택 → 원고 단어 교체
 * -----------------------------------------------------------------------------
 * - 현재 단어와 같으면 disabled
 * - 클릭 시 짧은 선택 하이라이트(약 120ms) 후 onSelect
 * =============================================================================
 */

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/** 선택 피드백 길이 (초) — 0.1~0.15s */
const SELECT_FLASH_MS = 120;

export interface ExpressionChipProps {
  label: string;
  disabled?: boolean;
  /** 키보드 포커스용 */
  tabIndex?: number;
  selected?: boolean;
  onSelect: (text: string) => void;
  onFocus?: () => void;
}

export function ExpressionChip({
  label,
  disabled,
  tabIndex = -1,
  selected,
  onSelect,
  onFocus,
}: ExpressionChipProps) {
  const [flash, setFlash] = useState(false);

  const handleActivate = () => {
    if (disabled) return;
    setFlash(true);
    window.setTimeout(() => {
      setFlash(false);
      onSelect(label);
    }, SELECT_FLASH_MS);
  };

  return (
    <button
      type="button"
      data-expression-chip=""
      disabled={disabled}
      tabIndex={tabIndex}
      aria-disabled={disabled || undefined}
      aria-current={selected ? "true" : undefined}
      title={
        disabled ? "현재 단어와 같습니다" : `${label}(으)로 바꾸기`
      }
      onClick={handleActivate}
      onFocus={onFocus}
      className={cn(
        "inline-flex max-w-full items-center rounded-ns-md border border-ns-border",
        "bg-ns-surface px-ns-3 py-ns-2 text-left text-ns-sm text-ns-ink",
        "transition-[border-color,background-color,box-shadow] duration-100",
        !disabled && "hover:border-ns-border-strong hover:bg-ns-muted",
        !disabled &&
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
        selected && !flash && "border-ns-accent bg-ns-accent-soft",
        flash && "border-ns-accent bg-ns-accent-soft shadow-[var(--ns-ring-accent)]",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
