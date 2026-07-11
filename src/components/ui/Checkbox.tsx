"use client";

/**
 * =============================================================================
 * Checkbox — 터치 친화 체크박스 (Export 옵션 등)
 * -----------------------------------------------------------------------------
 * 기존 Input/Button 과 같은 ns-* 토큰을 사용한다.
 * =============================================================================
 */

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** 체크박스 오른쪽 레이블 */
  label: ReactNode;
  /** 레이블 아래 보조 설명 */
  description?: ReactNode;
}

export function Checkbox({
  label,
  description,
  className,
  id,
  disabled,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-desc` : undefined;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-ns-touch cursor-pointer items-start gap-ns-3 rounded-ns-lg px-ns-2 py-ns-2",
        "hover:bg-ns-muted/50",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={descriptionId}
        className={cn(
          "mt-1 h-4 w-4 shrink-0 rounded border-ns-border text-ns-accent",
          "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
          "accent-[var(--ns-accent)]",
        )}
        {...props}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-ns-sm font-medium text-ns-ink">{label}</span>
        {description ? (
          <span
            id={descriptionId}
            className="mt-0.5 block text-ns-xs text-ns-ink-secondary"
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
