"use client";

/**
 * =============================================================================
 * SceneNavigatorToolbar
 * =============================================================================
 */

import { Button } from "@/components/ui/Button";

export interface SceneNavigatorToolbarProps {
  sceneCount: number;
  onAdd: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}

export function SceneNavigatorToolbar({
  sceneCount,
  onAdd,
  onCollapseAll,
  onExpandAll,
}: SceneNavigatorToolbarProps) {
  return (
    <div className="flex flex-col gap-ns-2 border-b border-ns-border px-ns-3 py-ns-3">
      <div className="flex items-center justify-between gap-ns-2">
        <div>
          <p className="text-ns-xs font-medium text-ns-ink-tertiary">Scenes</p>
          <p className="text-ns-sm font-semibold text-ns-ink">
            {sceneCount}개
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onAdd}
          className="rounded-ns-full"
        >
          + Scene
        </Button>
      </div>
      <div className="flex flex-wrap gap-ns-2">
        <button
          type="button"
          className="text-ns-xs font-medium text-ns-ink-secondary hover:text-ns-ink"
          onClick={onCollapseAll}
        >
          모두 접기
        </button>
        <span className="text-ns-xs text-ns-ink-tertiary">·</span>
        <button
          type="button"
          className="text-ns-xs font-medium text-ns-ink-secondary hover:text-ns-ink"
          onClick={onExpandAll}
        >
          모두 펼치기
        </button>
      </div>
      <p className="text-ns-xs leading-ns-normal text-ns-ink-tertiary">
        구분자 <code className="text-ns-ink-secondary">#1</code>{" "}
        <code className="text-ns-ink-secondary">#2</code> … 로 Scene이
        나뉩니다. 끌어 순서를 바꿀 수 있습니다.
      </p>
    </div>
  );
}
