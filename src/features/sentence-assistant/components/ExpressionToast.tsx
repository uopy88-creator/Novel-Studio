"use client";

/**
 * =============================================================================
 * ExpressionToast — 우측 하단, 약 2초
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface ExpressionToastProps {
  open: boolean;
  message: string;
  className?: string;
}

export function ExpressionToast({
  open,
  message,
  className,
}: ExpressionToastProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-ns-6 right-ns-6 z-[60]",
        "rounded-ns-md border border-ns-border bg-ns-surface px-ns-4 py-ns-3",
        "text-ns-sm text-ns-ink shadow-ns-md",
        className,
      )}
    >
      {message}
    </div>
  );
}
