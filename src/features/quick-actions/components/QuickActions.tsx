"use client";

/**
 * =============================================================================
 * Quick Actions UI (Selection Action Menu)
 * -----------------------------------------------------------------------------
 * - UI 만 담당. Action 을 직접 실행하지 않는다.
 * - Action Registry 를 읽어 버튼을 자동 생성한다.
 * - 위치는 Selection 변경 시에만 재계산 (스크롤 중 재계산 없음 → 스크롤 시 닫음).
 * - 메뉴는 document.body 포털 + position:fixed 로 렌더해 overflow 잘림을 피한다.
 * - 모바일: touchend 직후 selection 이 늦게 잡히므로 지연 동기화 + selectionchange.
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

/** iOS/Android — touchend 직후 selection 이 비어 있을 수 있어 재시도 */
const TOUCH_SYNC_DELAYS_MS = [0, 50, 120, 280] as const;

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
  const touchSyncTimersRef = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTouchSyncTimers = useCallback(() => {
    for (const id of touchSyncTimersRef.current) {
      window.clearTimeout(id);
    }
    touchSyncTimersRef.current = [];
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
        measuredSize?.width ?? 360,
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
    if (key === lastSelectionKeyRef.current && menuRef.current) {
      return;
    }
    lastSelectionKeyRef.current = key;
    placeMenu(selection);
  }, [enabled, placeMenu, textareaRef]);

  const syncAfterTouch = useCallback(() => {
    clearTouchSyncTimers();
    // 모바일에서 selection 확정이 touchend 이후인 경우가 많음
    touchSyncTimersRef.current = TOUCH_SYNC_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        syncFromSelection();
      }, delay),
    );
  }, [clearTouchSyncTimers, syncFromSelection]);

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
      clearTouchSyncTimers();
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
        syncAfterTouch();
      };
      const onPointerUp = (event: PointerEvent) => {
        // 터치 포인터는 touchend 경로로 처리
        if (event.pointerType === "touch") return;
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
        // iOS 장문 선택 핸들 드래그 중/후에 발생
        requestAnimationFrame(syncFromSelection);
      };
      const onScroll = () => {
        setMenu(null);
        lastSelectionKeyRef.current = null;
        clearTouchSyncTimers();
      };

      // document selectionchange — 모바일 선택 핸들 조작 시 textarea 이벤트만으로는 부족
      const onSelectionChange = () => {
        if (document.activeElement !== el) return;
        requestAnimationFrame(syncFromSelection);
      };

      const onVisualViewportChange = () => {
        // 키보드 열림/닫힘 — 메뉴가 있으면 위치만 다시 맞춤
        if (!lastSelectionKeyRef.current) return;
        const selection = readSelection(el);
        if (!selection) return;
        placeMenu(selection);
      };

      el.addEventListener("mouseup", onMouseUp);
      el.addEventListener("touchend", onTouchEnd, { passive: true });
      el.addEventListener("pointerup", onPointerUp);
      el.addEventListener("keyup", onKeyUp);
      el.addEventListener("select", onSelect);
      el.addEventListener("scroll", onScroll);
      document.addEventListener("selectionchange", onSelectionChange);
      window.visualViewport?.addEventListener("resize", onVisualViewportChange);
      window.visualViewport?.addEventListener("scroll", onVisualViewportChange);

      return () => {
        el.removeEventListener("mouseup", onMouseUp);
        el.removeEventListener("touchend", onTouchEnd);
        el.removeEventListener("pointerup", onPointerUp);
        el.removeEventListener("keyup", onKeyUp);
        el.removeEventListener("select", onSelect);
        el.removeEventListener("scroll", onScroll);
        document.removeEventListener("selectionchange", onSelectionChange);
        window.visualViewport?.removeEventListener(
          "resize",
          onVisualViewportChange,
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          onVisualViewportChange,
        );
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
      clearTouchSyncTimers();
      detach?.();
    };
  }, [
    clearTouchSyncTimers,
    enabled,
    placeMenu,
    syncAfterTouch,
    syncFromSelection,
    textareaRef,
  ]);

  const runAction = useCallback(
    (actionId: string, ctx: QuickActionContext) => {
      void engine.run(actionId, ctx).then(() => {
        setMenu(null);
        lastSelectionKeyRef.current = null;
        clearTouchSyncTimers();
      });
    },
    [clearTouchSyncTimers, engine],
  );

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
        // 1열 유지 — 좁은 화면에서는 가로 스크롤 (Highlight 가 맨 앞)
        "fixed z-[9999] flex max-w-[calc(100vw-16px)] flex-nowrap items-center gap-1 overflow-x-auto",
        "rounded-full border border-ns-border bg-ns-surface",
        "px-1 py-1 shadow-ns-md",
        "[-webkit-overflow-scrolling:touch]",
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
              "inline-flex min-h-11 shrink-0 items-center justify-center gap-2",
              "rounded-full px-3 text-sm font-medium text-ns-ink",
              "hover:bg-ns-muted",
              "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
              isHighlight && "bg-[#BFE8FF] hover:bg-[#A8DEFF]",
            )}
            onPointerDown={(event) => {
              // 선택 해제 방지 (마우스·터치 공통)
              event.preventDefault();
              event.stopPropagation();
              if (!ctx) return;
              runAction(action.id, ctx);
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
