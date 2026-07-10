"use client";

/**
 * =============================================================================
 * RecentInspirationCard — Dashboard용
 * =============================================================================
 */

import Link from "next/link";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { previewText } from "@/features/inspiration/lib/inspiration-storage";
import { studioPath } from "@/components/layout/nav-items";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface RecentInspirationCardProps {
  inspiration: Inspiration;
  projectId: string;
  className?: string;
}

export function RecentInspirationCard({
  inspiration,
  projectId,
  className,
}: RecentInspirationCardProps) {
  return (
    <Link
      href={studioPath(projectId, "inspiration")}
      className={cn("block min-w-0", className)}
    >
      <Card
        variant="outlined"
        padding="md"
        className="transition-colors hover:border-ns-border-strong"
      >
        <div className="flex items-start gap-ns-2">
          <span aria-hidden>💡</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-ns-sm font-semibold text-ns-ink">
              {inspiration.workTitle}
            </p>
            <p className="mt-ns-1 truncate text-ns-xs text-ns-ink-secondary">
              “{previewText(inspiration.selectedText, 40)}”
            </p>
            {inspiration.memo ? (
              <p className="mt-ns-1 truncate text-ns-xs text-ns-ink-tertiary">
                {previewText(inspiration.memo, 36)}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
