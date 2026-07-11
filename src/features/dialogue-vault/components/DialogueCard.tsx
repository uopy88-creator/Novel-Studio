"use client";

/**
 * =============================================================================
 * DialogueCard → Writing Vault 카드
 * -----------------------------------------------------------------------------
 * 종류 · 제목 · 내용 · 태그 · Reference · 즐겨찾기
 * =============================================================================
 */

import type { WritingVaultEntry } from "@/features/dialogue-vault/types/dialogue";
import { WRITING_VAULT_TYPE_LABELS } from "@/features/dialogue-vault/types/dialogue";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface DialogueCardProps {
  dialogue: WritingVaultEntry;
  onEdit: (dialogue: WritingVaultEntry) => void;
  onDelete: (dialogue: WritingVaultEntry) => void;
  onToggleFavorite: (dialogue: WritingVaultEntry) => void;
  className?: string;
}

export function DialogueCard({
  dialogue,
  onEdit,
  onDelete,
  onToggleFavorite,
  className,
}: DialogueCardProps) {
  const hasReference =
    dialogue.reference.workTitle.trim() ||
    dialogue.reference.author.trim() ||
    dialogue.reference.memo.trim();

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
          <div className="mb-ns-2 flex flex-wrap items-center gap-ns-2">
            <span className="text-ns-xs font-medium text-ns-ink-tertiary">
              {WRITING_VAULT_TYPE_LABELS[dialogue.type]}
            </span>
            {dialogue.title.trim() ? (
              <span className="text-ns-sm font-semibold text-ns-ink">
                {dialogue.title}
              </span>
            ) : null}
          </div>

          <p className="whitespace-pre-wrap text-ns-base leading-ns-relaxed text-ns-ink">
            {dialogue.content}
          </p>

          {hasReference ? (
            <p className="mt-ns-3 text-ns-xs leading-ns-relaxed text-ns-ink-secondary">
              <span className="font-medium text-ns-ink-tertiary">Ref · </span>
              {dialogue.reference.workTitle.trim() || "제목 없음"}
              {dialogue.reference.author.trim()
                ? ` · ${dialogue.reference.author.trim()}`
                : ""}
              {dialogue.reference.memo.trim() ? (
                <span className="mt-ns-1 block text-ns-ink-tertiary">
                  {dialogue.reference.memo.trim()}
                </span>
              ) : null}
            </p>
          ) : null}

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
          aria-label="항목 수정"
          onClick={() => onEdit(dialogue)}
        >
          수정
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          aria-label="항목 삭제"
          onClick={() => onDelete(dialogue)}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
