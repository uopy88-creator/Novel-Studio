"use client";

/**
 * =============================================================================
 * InspirationCard
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { previewText } from "@/features/inspiration/lib/inspiration-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface InspirationCardProps {
  inspiration: Inspiration;
  onOpen: (inspiration: Inspiration) => void;
  onDelete: (inspiration: Inspiration) => void;
  className?: string;
}

export function InspirationCard({
  inspiration,
  onOpen,
  onDelete,
  className,
}: InspirationCardProps) {
  return (
    <Card
      variant="outlined"
      padding="lg"
      className={cn("flex flex-col gap-ns-3", className)}
    >
      <button
        type="button"
        onClick={() => onOpen(inspiration)}
        className="flex flex-col gap-ns-2 text-left"
      >
        <div className="flex items-start gap-ns-2">
          <span className="text-ns-base" aria-hidden>
            💡
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-ns-base font-semibold text-ns-ink">
              {inspiration.workTitle || "제목 없음"}
            </h3>
            {inspiration.author ? (
              <p className="mt-ns-1 break-words text-ns-xs text-ns-ink-tertiary">
                {inspiration.author}
              </p>
            ) : null}
          </div>
        </div>

        <p className="break-words text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
          “{previewText(inspiration.selectedText, 72)}”
        </p>

        {inspiration.memo ? (
          <p className="break-words text-ns-xs text-ns-ink-tertiary">
            {previewText(inspiration.memo, 64)}
          </p>
        ) : (
          <p className="text-ns-xs text-ns-ink-tertiary">메모 없음</p>
        )}
      </button>

      <div className="flex justify-end gap-ns-1 border-t border-ns-border pt-ns-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpen(inspiration)}
        >
          열기
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          onClick={() => onDelete(inspiration)}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
