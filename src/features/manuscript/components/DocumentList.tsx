"use client";

/**
 * =============================================================================
 * DocumentList — Chapter 목록 (☰ Drag & Drop)
 * =============================================================================
 */

import { useMemo, type ReactNode } from "react";
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
import { DocumentCard } from "@/features/manuscript/components/DocumentCard";
import { cn } from "@/lib/utils/cn";

export interface DocumentListProps {
  documents: Chapter[];
  projectId: string;
  onEdit: (document: Chapter) => void;
  onDelete: (document: Chapter) => void;
  onReorder: (activeId: string, overId: string) => void;
  emptyAction?: ReactNode;
  className?: string;
}

export function DocumentList({
  documents,
  projectId,
  onEdit,
  onDelete,
  onReorder,
  emptyAction,
  className,
}: DocumentListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => documents.map((d) => d.id), [documents]);

  if (documents.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-16 text-center",
          className,
        )}
      >
        <p className="text-ns-lg font-medium text-ns-ink">
          아직 Chapter가 없습니다
        </p>
        <p className="mt-ns-2 max-w-sm text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
          Chapter를 만들면 Manuscript에 순서대로 이어집니다. ☰ 로 순서를 바꿀
          수 있습니다.
        </p>
        {emptyAction ? <div className="mt-ns-6">{emptyAction}</div> : null}
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn("flex flex-col gap-ns-3", className)}>
          {documents.map((document, index) => (
            <SortableChapterRow key={document.id} id={document.id}>
              <DocumentCard
                document={document}
                projectId={projectId}
                number={index + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </SortableChapterRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableChapterRow({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-ns-2",
        isDragging && "z-20 opacity-90",
      )}
    >
      <button
        type="button"
        className={cn(
          "mt-ns-4 flex h-10 w-10 shrink-0 touch-none items-center justify-center self-start",
          "cursor-grab rounded-ns-md border border-ns-border bg-ns-surface text-ns-ink-tertiary",
          "hover:bg-ns-muted hover:text-ns-ink active:cursor-grabbing",
        )}
        aria-label="Chapter 순서 변경"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>☰</span>
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
