"use client";

/**
 * =============================================================================
 * TimelineEventItem — 드래그 가능한 사건 한 줄
 * =============================================================================
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import { cn } from "@/lib/utils/cn";

export interface TimelineEventItemProps {
  event: TimelineEvent;
  index: number;
  sectionLabel?: string;
  characterName?: string;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
  onOpenSection?: (event: TimelineEvent) => void;
}

export function TimelineEventItem({
  event,
  index,
  sectionLabel,
  characterName,
  onEdit,
  onDelete,
  onOpenSection,
}: TimelineEventItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-ns-2 rounded-ns-lg border border-ns-border bg-ns-surface px-ns-3 py-ns-3",
        isDragging && "z-20 opacity-90 shadow-ns-md",
      )}
    >
      <button
        type="button"
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 touch-none items-center justify-center",
          "cursor-grab rounded-ns-md text-ns-ink-tertiary",
          "hover:bg-ns-muted hover:text-ns-ink active:cursor-grabbing",
        )}
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>⋮⋮</span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-ns-xs font-medium text-ns-ink-tertiary">
          {index + 1}
        </p>
        <button
          type="button"
          className="mt-0.5 w-full text-left"
          onClick={() => onEdit(event)}
        >
          <span className="block text-ns-sm font-semibold text-ns-ink">
            {event.title || "제목 없음"}
          </span>
          {event.description ? (
            <span className="mt-ns-1 block text-ns-xs leading-ns-relaxed text-ns-ink-secondary">
              {event.description}
            </span>
          ) : null}
        </button>

        <div className="mt-ns-2 flex flex-wrap gap-ns-2">
          {sectionLabel && event.sectionStableId ? (
            <button
              type="button"
              className="rounded-ns-md bg-ns-muted px-ns-2 py-0.5 text-ns-xs text-ns-ink-secondary hover:text-ns-ink"
              onClick={() => onOpenSection?.(event)}
              title="Manuscript의 Section으로 이동"
            >
              📑 {sectionLabel}
            </button>
          ) : null}
          {characterName ? (
            <span className="rounded-ns-md bg-ns-muted px-ns-2 py-0.5 text-ns-xs text-ns-ink-secondary">
              👤 {characterName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-ns-1">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-ns-md text-ns-xs text-ns-ink-tertiary hover:bg-ns-muted hover:text-ns-ink"
          onClick={() => onEdit(event)}
          aria-label="수정"
        >
          ✎
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-ns-md text-ns-xs text-ns-ink-tertiary hover:bg-ns-danger-soft hover:text-ns-danger"
          onClick={() => onDelete(event)}
          aria-label="삭제"
        >
          ×
        </button>
      </div>
    </li>
  );
}
