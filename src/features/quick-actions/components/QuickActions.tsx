"use client";

/**
 * =============================================================================
 * Quick Actions UI
 * -----------------------------------------------------------------------------
 * - UI 만 담당. Action 을 직접 실행하지 않는다.
 * - Action Registry 를 읽어 버튼을 자동 생성한다 (하드코딩 금지).
 * - 클릭 시 Action Engine.run 만 호출한다.
 *
 * 새 Action 추가: Registry.register 만 하면 이 컴포넌트는 수정하지 않는다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActionEngine } from "@/features/quick-actions/engine/ActionEngine";
import { estimateQuickActionsPosition } from "@/features/quick-actions/lib/position";
import type {
  QuickAction,
  QuickActionContext,
  QuickActionSelection,
} from "@/features/quick-actions/types";
import { cn } from "@/lib/utils/cn";

export interface QuickActionsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  engine: ActionEngine;
  enabled?: boolean;
}

interface MenuState {
  top: number;
  left: number;
  selection: QuickActionSelection;
}

function readSelection(
  el: HTMLTextAreaElement | null,
): QuickActionSelection | null {
  if (!el) return null;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  if (start === end) return null;
  const text = el.value.slice(start, end);
  if (!text.trim()) return null;
  return { text, start, end };
}

export function QuickActions({
  textareaRef,
  engine,
  enabled = true,
}: QuickActionsProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const syncFromSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!enabled || !el) {
      setMenu(null);
      return;
    }

    const selection = readSelection(el);
    if (!selection) {
      setMenu(null);
      return;
    }

    const pos = estimateQuickActionsPosition(el, selection.start);
    setMenu({
      top: pos.top,
      left: pos.left,
      selection,
    });
  }, [enabled, textareaRef]);

  useEffect(() => {
    if (!enabled) {
      setMenu(null);
      return;
    }

    const el = textareaRef.current;
    if (!el) return;

    const onMouseUp = () => {
      requestAnimationFrame(syncFromSelection);
    };

    const onTouchEnd = () => {
      // iPhone / Android / iPad — 선택 확정 후
      requestAnimationFrame(syncFromSelection);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
        return;
      }
      requestAnimationFrame(syncFromSelection);
    };

    // 스크롤: 화면에 sticky 고정하지 않고, 선택 오프셋 기준으로 재배치
    const onScroll = () => {
      requestAnimationFrame(syncFromSelection);
    };

    const onSelect = () => {
      requestAnimationFrame(syncFromSelection);
    };

    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("scroll", onScroll);
    el.addEventListener("select", onSelect);

    return () => {
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("select", onSelect);
    };
  }, [enabled, syncFromSelection, textareaRef]);

  const ctx: QuickActionContext | null = useMemo(() => {
    if (!menu) return null;
    return {
      selection: menu.selection,
      textarea: textareaRef.current,
    };
  }, [menu, textareaRef]);

  const actions: QuickAction[] = useMemo(() => {
    if (!ctx) return [];
    return engine.getAvailableActions(ctx);
  }, [ctx, engine]);

  if (!menu || actions.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute z-40 flex flex-wrap items-center gap-ns-1",
        "rounded-ns-full border border-ns-border bg-ns-surface",
        "px-ns-1 py-ns-1 shadow-ns-md",
      )}
      style={{ top: menu.top, left: menu.left }}
      role="toolbar"
      aria-label="Quick Actions"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          data-quick-action={action.id}
          className={cn(
            // 모바일 최소 터치 영역 44×44
            "inline-flex min-h-11 min-w-11 items-center justify-center gap-ns-2",
            "rounded-ns-full px-ns-3 text-ns-sm font-medium text-ns-ink",
            "hover:bg-ns-muted",
            "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
          )}
          onMouseDown={(event) => {
            // textarea 선택 유지
            event.preventDefault();
            if (!ctx) return;
            void engine.run(action.id, ctx).then(() => {
              setMenu(null);
            });
          }}
        >
          <span aria-hidden>{action.icon}</span>
          <span className="whitespace-nowrap">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
