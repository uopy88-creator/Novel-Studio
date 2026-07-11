"use client";

/**
 * =============================================================================
 * ChapterOutline
 * -----------------------------------------------------------------------------
 * Manuscript 좌측 — Chapter 목록 + ☰ 드래그 핸들.
 * 순서 변경 시 Manuscript 본문도 동기화된다.
 * =============================================================================
 */

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterBlock } from "@/features/manuscript/lib/chapter-blocks";
import { cn } from "@/lib/utils/cn";

export interface ChapterOutlineProps {
  chapters: Chapter[];
  blocks: ChapterBlock[];
  activeChapterId: string | null;
  onSelect: (chapterId: string, startOffset: number) => void;
  onReorder: (activeId: string, overId: string) => void;
  className?: string;
}

export function ChapterOutline({
  chapters,
  blocks,
  activeChapterId,
  onSelect,
  onReorder,
  className,
}: ChapterOutlineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => chapters.map((c) => c.id), [chapters]);
  const blockById = useMemo(() => {
    const map = new Map<string, ChapterBlock>();
    for (const b of blocks) map.set(b.chapterId, b);
    return map;
  }, [blocks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  const panel = (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-ns-xl border border-ns-border bg-ns-surface",
        className,
      )}
    >
      <div className="border-b border-ns-border px-ns-3 py-ns-3">
        <p className="text-ns-xs font-medium text-ns-ink-tertiary">Chapters</p>
        <p className="text-ns-sm font-semibold text-ns-ink">
          {chapters.length}개
        </p>
        <p className="mt-ns-1 text-ns-xs text-ns-ink-tertiary">
          ☰ 로 순서를 바꾸면 원고도 함께 바뀝니다.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="min-h-0 flex-1 space-y-ns-1 overflow-y-auto px-ns-2 py-ns-2">
            {chapters.map((chapter, index) => (
              <ChapterOutlineItem
                key={chapter.id}
                chapter={chapter}
                index={index}
                active={chapter.id === activeChapterId}
                charCount={blockById.get(chapter.id)?.body.replace(/\s/g, "").length ?? 0}
                onSelect={() => {
                  const block = blockById.get(chapter.id);
                  onSelect(chapter.id, block?.startOffset ?? 0);
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <div className="mb-ns-4 max-h-[40vh] overflow-hidden">{panel}</div>
      </div>
      <aside className="hidden min-h-[20rem] w-56 shrink-0 lg:block xl:w-64">
        <div className="sticky top-ns-6 max-h-[calc(100vh-6rem)]">{panel}</div>
      </aside>
    </>
  );
}

function ChapterOutlineItem({
  chapter,
  index,
  active,
  charCount,
  onSelect,
}: {
  chapter: Chapter;
  index: number;
  active: boolean;
  charCount: number;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-ns-1 rounded-ns-md border border-transparent",
        active && "border-ns-accent-border bg-ns-accent-soft",
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
        aria-label={`${chapter.title} 끌기`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>☰</span>
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 px-ns-1 py-ns-2 text-left"
        onClick={onSelect}
      >
        <span className="block text-ns-xs text-ns-ink-tertiary">
          Chapter {index + 1}
        </span>
        <span className="block truncate text-ns-sm font-medium text-ns-ink">
          {chapter.title || "제목 없음"}
        </span>
        <span className="mt-0.5 block text-ns-xs text-ns-ink-tertiary">
          {charCount.toLocaleString()}자
        </span>
      </button>
    </li>
  );
}
