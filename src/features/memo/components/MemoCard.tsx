"use client";

/**
 * =============================================================================
 * MemoCard — 목록 한 줄 (내용 · Pin · 수정)
 * =============================================================================
 */

import type { Memo } from "@/features/memo/types/memo";
import { useSectionLabel } from "@/features/sections";
import type { ProjectId } from "@/types/ids";
import { cn } from "@/lib/utils/cn";

export interface MemoCardProps {
  projectId: ProjectId;
  memo: Memo;
  onOpen: (memo: Memo) => void;
  onTogglePin: (memo: Memo) => void;
}

export function MemoCard({
  projectId,
  memo,
  onOpen,
  onTogglePin,
}: MemoCardProps) {
  const sectionLabel = useSectionLabel(projectId, memo.sectionStableId);

  return (
    <article
      className={cn(
        "group flex gap-ns-3 rounded-ns-xl border border-ns-border bg-ns-surface p-ns-4",
        "hover:border-ns-accent/40",
      )}
    >
      <button
        type="button"
        onClick={() => onTogglePin(memo)}
        className={cn(
          "mt-0.5 shrink-0 rounded-ns-md px-ns-1 py-0.5 text-ns-base",
          "text-ns-ink-tertiary hover:bg-ns-muted hover:text-ns-accent",
          memo.isPinned && "text-ns-accent",
        )}
        aria-label={memo.isPinned ? "고정 해제" : "상단에 고정"}
        title={memo.isPinned ? "고정 해제" : "상단에 고정"}
      >
        {memo.isPinned ? "📌" : "📍"}
      </button>

      <button
        type="button"
        onClick={() => onOpen(memo)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="whitespace-pre-wrap break-words text-ns-sm leading-ns-relaxed text-ns-ink">
          {memo.body}
        </p>
        {sectionLabel ? (
          <p className="mt-ns-2 text-ns-xs text-ns-ink-tertiary">
            {sectionLabel}
          </p>
        ) : null}
      </button>
    </article>
  );
}
