"use client";

/**
 * =============================================================================
 * ContextHelpButton — 페이지 우측 상단 ❓ Help
 * =============================================================================
 */

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface ContextHelpButtonProps {
  onClick: () => void;
  className?: string;
  /** 접근성 라벨 */
  label?: string;
}

export function ContextHelpButton({
  onClick,
  className,
  label = "이 화면 도움말",
}: ContextHelpButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("shrink-0 gap-ns-1 px-ns-2", className)}
    >
      <span aria-hidden>❓</span>
      <span className="hidden sm:inline">Help</span>
    </Button>
  );
}
