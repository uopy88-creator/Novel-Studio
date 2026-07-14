"use client";

/**
 * =============================================================================
 * Quick Actions UI (Selection Action Menu)
 * -----------------------------------------------------------------------------
 * - UI 만 담당. Action 을 직접 실행하지 않는다.
 * - Action Registry 를 읽어 버튼을 자동 생성한다.
 * - 위치는 Selection 변경 시에만 재계산 (스크롤 중 재계산 없음 → 스크롤 시 닫음).
 * - 메뉴는 document.body 포털 + position:fixed 로 렌더해 overflow 잘림을 피한다.
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
import { createPortal } from "react-dom";
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
   * fixed 포털 사용 시에는 좌표 계산 보조로만 쓰인다.
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
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const lastSelectionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

      // fixed 포털 — viewport 좌표 사용 (부모 overflow 에 잘리지 않음)
      setMenu({
        top: pos.viewportTop,
        left: pos.viewportLeft,
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

    let cancelled = false;
    let detach: (() => void) | null = null;
    let retryTimer: number | null = null;

    const attach = (el: HTMLTextAreaElement) => {
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
    };

    const tryAttach = () => {
      const el = textareaRef.current;
      if (!el || cancelled) return false;
      detach = attach(el);
      return true;
    };

    if (!tryAttach()) {
      // textarea ref 가 첫 paint 이후에 붙는 경우 재시도
      retryTimer = window.setInterval(() => {
        if (tryAttach() && retryTimer != null) {
          window.clearInterval(retryTimer);
          retryTimer = null;
        }
      }, 50);
    }

    return () => {
      cancelled = true;
      if (retryTimer != null) window.clearInterval(retryTimer);
      detach?.();
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

  if (!mounted || !menu || actions.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] flex max-w-[min(100vw-16px,28rem)] flex-wrap items-center gap-1",
        "rounded-lg border border-ns-border bg-ns-surface",
        "px-1 py-1 shadow-ns-md",
      )}
      style={{ top: menu.top, left: menu.left }}
      role="toolbar"
      aria-label="Quick Actions"
      data-quick-actions-menu=""
    >
      {actions.map((action) => {
        const isHighlight = action.id === "highlight";
        return (
          <button
            key={action.id}
            type="button"
            data-quick-action={action.id}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2",
              "rounded-md px-3 text-sm font-medium text-ns-ink",
              "hover:bg-ns-muted",
              "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
              isHighlight && "bg-[#BFE8FF] hover:bg-[#A8DEFF]",
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
        );
      })}
    </div>,
    document.body,
  );
}
