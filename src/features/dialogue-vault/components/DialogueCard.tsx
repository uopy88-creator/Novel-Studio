"use client";

/**
 * =============================================================================
 * DialogueCard
 * -----------------------------------------------------------------------------
 * 카드에 표시: 대사 · 태그 · 즐겨찾기 여부
 * 수정/삭제는 카드 액션으로 처리한다.
 * =============================================================================
 */

import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface DialogueCardProps {
  dialogue: Dialogue;
  onEdit: (dialogue: Dialogue) => void;
  onDelete: (dialogue: Dialogue) => void;
  onToggleFavorite: (dialogue: Dialogue) => void;
  className?: string;
}

export function DialogueCard({
  dialogue,
  onEdit,
  onDelete,
  onToggleFavorite,
  className,
}: DialogueCardProps) {
  return (
    <Card
      variant="outlined"
      padding="lg"
      className={cn(
        "flex flex-col gap-ns-4",
        dialogue.isFavorite && "border-ns-accent-border bg-ns-accent-soft/30",
        className,
      )}
    >
      <div className="flex items-start gap-ns-3">
        {/* 즐겨찾기 토글 */}
        <button
          type="button"
          onClick={() => onToggleFavorite(dialogue)}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-ns-md",
            "text-ns-lg transition-colors hover:bg-ns-muted",
            dialogue.isFavorite ? "text-ns-accent" : "text-ns-ink-tertiary",
          )}
          aria-label={
            dialogue.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
          }
          aria-pressed={dialogue.isFavorite}
          title={dialogue.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        >
          {dialogue.isFavorite ? "⭐" : "☆"}
        </button>

        <div className="min-w-0 flex-1">
          {/* 대사 */}
          <p className="whitespace-pre-wrap text-ns-base leading-ns-relaxed text-ns-ink">
            {dialogue.content}
          </p>

          {/* 태그 */}
          {dialogue.tags.length > 0 ? (
            <ul className="mt-ns-3 flex flex-wrap gap-ns-2">
              {dialogue.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-ns-full bg-ns-muted px-ns-3 py-ns-1 text-ns-xs font-medium text-ns-ink-secondary"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-ns-3 text-ns-xs text-ns-ink-tertiary">태그 없음</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-ns-1 border-t border-ns-border pt-ns-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="대사 수정"
          onClick={() => onEdit(dialogue)}
        >
          수정
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          aria-label="대사 삭제"
          onClick={() => onDelete(dialogue)}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
