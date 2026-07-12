"use client";

/**
 * =============================================================================
 * ForeshadowingCard
 * -----------------------------------------------------------------------------
 * 복선 카드 — 📌 제목 · 상태 · 설명 · 수정/삭제.
 * =============================================================================
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { FORESHADOWING_STATUS_LABELS } from "@/features/foreshadowing/types/foreshadowing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface ForeshadowingCardProps {
  foreshadowing: Foreshadowing;
  onEdit: (foreshadowing: Foreshadowing) => void;
  onDelete: (foreshadowing: Foreshadowing) => void;
  className?: string;
}

export function ForeshadowingCard({
  foreshadowing,
  onEdit,
  onDelete,
  className,
}: ForeshadowingCardProps) {
  const statusLabel = FORESHADOWING_STATUS_LABELS[foreshadowing.status];

  return (
    <Card
      variant="outlined"
      padding="none"
      className={cn(
        "overflow-hidden transition-colors hover:border-ns-border-strong",
        className,
      )}
    >
      {/* 카드 본문 — 클릭 시 수정 */}
      <button
        type="button"
        onClick={() => onEdit(foreshadowing)}
        className="flex w-full flex-col gap-ns-2 px-ns-4 py-ns-4 text-left"
      >
        <div className="flex items-start gap-ns-2">
          <span className="text-ns-lg leading-none" aria-hidden>
            📌
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-ns-base font-semibold text-ns-ink">
              {foreshadowing.title}
            </h3>
            <p className="mt-ns-1 text-ns-xs font-medium text-ns-ink-tertiary">
              {statusLabel}
            </p>
          </div>
        </div>

        {foreshadowing.description ? (
          <p className="line-clamp-3 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {foreshadowing.description}
          </p>
        ) : (
          <p className="text-ns-sm text-ns-ink-tertiary">설명 없음</p>
        )}
      </button>

      {/* 하단 액션 */}
      <div className="flex items-center justify-end gap-ns-1 border-t border-ns-border px-ns-2 py-ns-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(foreshadowing)}
        >
          수정
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          onClick={() => onDelete(foreshadowing)}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
