"use client";

/**
 * =============================================================================
 * CopyToast — 우측 하단 「복사되었습니다.」 (~2초)
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface CopyToastProps {
  open: boolean;
  message?: string;
}

export function CopyToast({
  open,
  message = "복사되었습니다.",
}: CopyToastProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-ns-6 right-ns-6 z-[70]",
        "rounded-ns-md border border-ns-border bg-ns-surface px-ns-4 py-ns-3",
        "text-ns-sm text-ns-ink shadow-ns-lg",
      )}
    >
      {message}
    </div>
  );
}
