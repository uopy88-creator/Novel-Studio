"use client";

/**
 * =============================================================================
 * Quick Actions UI (Selection Action Menu)
 * -----------------------------------------------------------------------------
 * - UI 만 담당. Action 을 직접 실행하지 않는다.
 * - Action Registry 를 읽어 버튼을 자동 생성한다.
 * - 위치는 Selection 변경 시에만 재계산 (스크롤 중 재계산 없음 → 스크롤 시 닫음).
 * =============================================================================
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  /**
   * Quick Actions 메뉴의 position:absolute 기준 요소.
   * 미지정 시 textarea.offsetParent 를 사용한다.
   */
  positionParentRef?: React.RefObject<HTMLElement | null>;
}

interface MenuState {
  top: number;
  left: number;
  selection: QuickActionSelection;
  /** 이 Selection 에 대해 실측 보정했는지 */
  measured: boolean;
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

function selectionKey(selection: QuickActionSelection): string {
  return `${selection.start}:${selection.end}`;
}

export function QuickActions({
  textareaRef,
  engine,
  enabled = true,
  positionParentRef,
}: QuickActionsProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const lastSelectionKeyRef = useRef<string | null>(null);

  const placeMenu = useCallback(
    (
      selection: QuickActionSelection,
      measuredSize?: { width: number; height: number },
    ) => {
      const el = textareaRef.current;
      if (!el) return;

      const pos = estimateQuickActionsPosition(
        el,
        selection.start,
        selection.end,
        measuredSize?.width ?? 320,
        measuredSize?.height ?? 52,
        positionParentRef?.current,
      );

      setMenu({
        top: pos.top,
        left: pos.left,
        selection,
        measured: Boolean(measuredSize),
      });
    },
    [positionParentRef, textareaRef],
  );

  const syncFromSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!enabled || !el) {
      setMenu(null);
      lastSelectionKeyRef.current = null;
      return;
    }

    const selection = readSelection(el);
    if (!selection) {
      setMenu(null);
      lastSelectionKeyRef.current = null;
      return;
    }

    const key = selectionKey(selection);
    if (key === lastSelectionKeyRef.current) {
      return;
    }
    lastSelectionKeyRef.current = key;
    placeMenu(selection);
  }, [enabled, placeMenu, textareaRef]);

  // 실제 메뉴 높이/너비로 1회 보정
  useLayoutEffect(() => {
    if (!menu || menu.measured || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    placeMenu(menu.selection, { width: rect.width, height: rect.height });
  }, [menu, placeMenu]);

  useEffect(() => {
    if (!enabled) {
      setMenu(null);
      lastSelectionKeyRef.current = null;
      return;
    }

    const el = textareaRef.current;
    if (!el) return;

    const onMouseUp = () => {
      requestAnimationFrame(syncFromSelection);
    };

    const onTouchEnd = () => {
      requestAnimationFrame(syncFromSelection);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
        lastSelectionKeyRef.current = null;
        return;
      }
      requestAnimationFrame(syncFromSelection);
    };

    const onSelect = () => {
      requestAnimationFrame(syncFromSelection);
    };

    // 스크롤: 재계산하지 않고 닫기
    const onScroll = () => {
      setMenu(null);
      lastSelectionKeyRef.current = null;
    };

    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("select", onSelect);
    el.addEventListener("scroll", onScroll);

    return () => {
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("select", onSelect);
      el.removeEventListener("scroll", onScroll);
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
      ref={menuRef}
      className={cn(
        "absolute z-40 flex max-w-[min(100%,24rem)] flex-wrap items-center gap-ns-1",
        "rounded-ns-lg border border-ns-border bg-ns-surface",
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
            "inline-flex min-h-11 items-center justify-center gap-ns-2",
            "rounded-ns-md px-ns-3 text-ns-sm font-medium text-ns-ink",
            "hover:bg-ns-muted",
            "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
          )}
          onMouseDown={(event) => {
            event.preventDefault();
            if (!ctx) return;
            void engine.run(action.id, ctx).then(() => {
              setMenu(null);
              lastSelectionKeyRef.current = null;
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
