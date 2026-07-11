"use client";

/**
 * =============================================================================
 * SceneNavigator
 * -----------------------------------------------------------------------------
 * 원고 왼쪽(데스크톱) / 상단 드로어(모바일·iPad) Scene 목록.
 * @dnd-kit 으로 PC·터치 드래그를 지원한다.
 *
 * Manuscript 는 하나의 긴 문서이며, Scene 은 #1 #2 … 구분자로만 나뉜다.
 * =============================================================================
 */

import { useMemo, useState } from "react";
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Scene, SceneStatus } from "@/features/manuscript/types/scene";
import type { SceneDeleteMode } from "@/features/manuscript/lib/scene-operations";
import { SceneNavigatorItem } from "@/features/manuscript/components/scene-navigator/SceneNavigatorItem";
import { SceneNavigatorToolbar } from "@/features/manuscript/components/scene-navigator/SceneNavigatorToolbar";
import { SceneDeleteDialog } from "@/features/manuscript/components/scene-navigator/SceneDeleteDialog";
import { cn } from "@/lib/utils/cn";

export interface SceneNavigatorProps {
  scenes: Scene[];
  activeSceneId: string | null;
  collapsedIds: Set<string>;
  onSelect: (scene: Scene) => void;
  onReorder: (activeId: string, overId: string) => void;
  onAdd: () => void;
  onDelete: (sceneId: string, mode: SceneDeleteMode) => void;
  onRename: (sceneId: string, title: string) => void;
  onStatusChange: (sceneId: string, status: SceneStatus) => void;
  onMemoChange: (sceneId: string, memo: string) => void;
  onToggleCollapse: (sceneId: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  className?: string;
}

export function SceneNavigator({
  scenes,
  activeSceneId,
  collapsedIds,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onRename,
  onStatusChange,
  onMemoChange,
  onToggleCollapse,
  onCollapseAll,
  onExpandAll,
  className,
}: SceneNavigatorProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deleting, setDeleting] = useState<Scene | null>(null);

  // 터치·마우스·키보드 모두 지원 (activationConstraint 로 스크롤과 구분)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => scenes.map((s) => s.id), [scenes]);

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
      <SceneNavigatorToolbar
        sceneCount={scenes.length}
        onAdd={onAdd}
        onCollapseAll={onCollapseAll}
        onExpandAll={onExpandAll}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="min-h-0 flex-1 space-y-ns-1 overflow-y-auto px-ns-2 py-ns-2 overscroll-contain">
            {scenes.map((scene) => (
              <SceneNavigatorItem
                key={scene.id}
                scene={scene}
                active={scene.id === activeSceneId}
                collapsed={collapsedIds.has(scene.id)}
                onSelect={(s) => {
                  onSelect(s);
                  setMobileOpen(false);
                }}
                onToggleCollapse={onToggleCollapse}
                onRename={onRename}
                onDeleteRequest={(s) => setDeleting(s)}
                onStatusChange={onStatusChange}
                onMemoChange={onMemoChange}
                canDelete={scenes.length > 1}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <>
      {/* 모바일·iPad: 토글 패널 */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "mb-ns-3 flex min-h-ns-touch w-full items-center justify-between",
            "rounded-ns-lg border border-ns-border bg-ns-surface px-ns-4",
            "text-ns-sm font-medium text-ns-ink",
          )}
        >
          <span>Scene Navigator ({scenes.length})</span>
          <span aria-hidden>{mobileOpen ? "▴" : "▾"}</span>
        </button>
        {mobileOpen ? (
          <div className="mb-ns-4 max-h-[50vh] touch-pan-y">{panel}</div>
        ) : null}
      </div>

      {/* 데스크톱: 좌측 고정 패널 */}
      <aside className="hidden min-h-[28rem] lg:block lg:w-64 lg:shrink-0 xl:w-72">
        <div className="sticky top-ns-6 max-h-[calc(100vh-6rem)]">{panel}</div>
      </aside>

      <SceneDeleteDialog
        open={Boolean(deleting)}
        scene={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(scene, mode) => {
          onDelete(scene.id, mode);
          setDeleting(null);
        }}
      />
    </>
  );
}
