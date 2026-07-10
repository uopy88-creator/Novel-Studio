/**
 * =============================================================================
 * AutoSaveIndicator
 * -----------------------------------------------------------------------------
 * 원고 자동 저장 상태를 짧게 보여 준다.
 * =============================================================================
 */

import type { SaveStatus } from "@/features/manuscript/hooks/useManuscript";
import { formatShortTime } from "@/features/manuscript/lib/format-date";
import { cn } from "@/lib/utils/cn";

export interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: string | null;
  className?: string;
}

function statusLabel(status: SaveStatus, lastSavedAt: string | null): string {
  switch (status) {
    case "dirty":
      return "저장 대기…";
    case "saving":
      return "저장 중…";
    case "saved":
      return lastSavedAt
        ? `저장됨 · ${formatShortTime(lastSavedAt)}`
        : "저장됨";
    case "error":
      return "저장 실패";
    case "idle":
    default:
      return lastSavedAt
        ? `마지막 저장 · ${formatShortTime(lastSavedAt)}`
        : "아직 저장되지 않음";
  }
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  className,
}: AutoSaveIndicatorProps) {
  return (
    <p
      className={cn(
        "text-ns-xs font-medium",
        status === "error" ? "text-ns-danger" : "text-ns-ink-tertiary",
        status === "saved" && "text-ns-accent",
        className,
      )}
      aria-live="polite"
    >
      {statusLabel(status, lastSavedAt)}
    </p>
  );
}
