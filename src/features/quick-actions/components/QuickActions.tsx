"use client";

/**
 * =============================================================================
 * Quick Actions UI (Selection Action Menu)
 * -----------------------------------------------------------------------------
 * - UI 만 담당. Action 을 직접 실행하지 않는다.
 * - Action Registry 를 읽어 버튼을 자동 생성한다.
 * - 메뉴는 document.body 포털 + position:fixed.
 *
 * 모바일 주의:
 * - 선택 핸들은 textarea 밖에서 조작되므로 document 단 touch/pointer 를 본다.
 * - 선택 직후 OS 가 textarea/viewport 를 스크롤해도 메뉴를 닫지 않고 위치를 갱신한다.
 * - 좁은 화면·터치 환경에서는 선택 위 대신 visualViewport 하단에 1열 고정.
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
  positionParentRef?: React.RefObject<HTMLElement | null>;
}

interface MenuState {
  top: number;
  left: number;
  selection: QuickActionSelection;
  measured: boolean;
  /** 하단 고정 (모바일) */
  docked: boolean;
}

const TOUCH_SYNC_DELAYS_MS = [0, 32, 80, 160, 320, 500] as const;
const CLEAR_SELECTION_DELAY_MS = 180;

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

/** 터치·좁은 화면 → 하단 도킹 */
function shouldDockToBottom(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  return coarse || noHover || window.innerWidth < 768;
}

function estimateDockedPosition(menuWidth: number, menuHeight: number): {
  top: number;
  left: number;
} {
  const vv = window.visualViewport;
  const width = vv?.width ?? window.innerWidth;
  const height = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  const offsetLeft = vv?.offsetLeft ?? 0;
  const pad = 10;
  const usableWidth = Math.min(menuWidth, width - pad * 2);
  const left =
    offsetLeft + Math.max(pad, (width - usableWidth) / 2);
  const top = offsetTop + height - menuHeight - pad;
  return { top: Math.max(offsetTop + pad, top), left };
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
  const clearTimerRef = useRef<number | null>(null);
  const menuSelectionRef = useRef<QuickActionSelection | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTouchSyncTimers = useCallback(() => {
    for (const id of touchSyncTimersRef.current) {
      window.clearTimeout(id);
    }
    touchSyncTimersRef.current = [];
  }, []);

  const clearClearTimer = useCallback(() => {
    if (clearTimerRef.current != null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
    menuSelectionRef.current = null;
    lastSelectionKeyRef.current = null;
    clearTouchSyncTimers();
    clearClearTimer();
  }, [clearClearTimer, clearTouchSyncTimers]);

  const placeMenu = useCallback(
    (
      selection: QuickActionSelection,
      measuredSize?: { width: number; height: number },
    ) => {
      const el = textareaRef.current;
      if (!el) return;

      const docked = shouldDockToBottom();
      const menuWidth = measuredSize?.width ?? (docked ? 360 : 360);
      const menuHeight = measuredSize?.height ?? 52;

      let top: number;
      let left: number;

      if (docked) {
        const dockedPos = estimateDockedPosition(menuWidth, menuHeight);
        top = dockedPos.top;
        left = dockedPos.left;
      } else {
        const pos = estimateQuickActionsPosition(
          el,
          selection.start,
          selection.end,
          menuWidth,
          menuHeight,
          positionParentRef?.current,
        );
        top = pos.viewportTop;
        left = pos.viewportLeft;
      }

      menuSelectionRef.current = selection;
      lastSelectionKeyRef.current = selectionKey(selection);
      setMenu({
        top,
        left,
        selection,
        measured: Boolean(measuredSize),
        docked,
      });
    },
    [positionParentRef, textareaRef],
  );

  const syncFromSelection = useCallback(
    (options?: { allowClear?: boolean }) => {
      const allowClear = options?.allowClear !== false;
      const el = textareaRef.current;
      if (!enabled || !el) {
        closeMenu();
        return;
      }

      const selection = readSelection(el);
      if (!selection) {
        // 모바일에서 selection 이 잠깐 비는 프레임이 있어 즉시 닫지 않는다
        if (!allowClear) return;
        clearClearTimer();
        clearTimerRef.current = window.setTimeout(() => {
          const stillEmpty = !readSelection(textareaRef.current);
          if (stillEmpty) closeMenu();
        }, CLEAR_SELECTION_DELAY_MS);
        return;
      }

      clearClearTimer();
      const key = selectionKey(selection);
      // 같은 선택이면 메뉴 유지 (위치 갱신은 scroll / visualViewport 핸들러가 담당)
      if (key === lastSelectionKeyRef.current && menuRef.current) {
        return;
      }
      placeMenu(selection);
    },
    [clearClearTimer, closeMenu, enabled, placeMenu, textareaRef],
  );

  const syncAfterTouch = useCallback(() => {
    clearTouchSyncTimers();
    touchSyncTimersRef.current = TOUCH_SYNC_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        syncFromSelection({ allowClear: delay > 100 });
      }, delay),
    );
  }, [clearTouchSyncTimers, syncFromSelection]);

  // 실제 메뉴 크기 보정
  useLayoutEffect(() => {
    if (!menu || menu.measured || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    placeMenu(menu.selection, { width: rect.width, height: rect.height });
  }, [menu, placeMenu]);

  useEffect(() => {
    if (!enabled) {
      closeMenu();
      return;
    }

    let cancelled = false;
    let detach: (() => void) | null = null;
    let retryTimer: number | null = null;

    const attach = (el: HTMLTextAreaElement) => {
      const onMouseUp = () => {
        requestAnimationFrame(() => syncFromSelection());
      };

      // 선택 핸들은 textarea 밖에서 끝나므로 document 캡처로 본다
      const onDocTouchEnd = (event: TouchEvent) => {
        const target = event.target as Node | null;
        if (menuRef.current?.contains(target)) return;
        if (document.activeElement !== el && target !== el) {
          // 에디터 밖 터치 — 선택이 남아 있으면 유지, 없으면 지연 후 닫기
          syncAfterTouch();
          return;
        }
        syncAfterTouch();
      };

      const onDocPointerUp = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const target = event.target as Node | null;
        if (menuRef.current?.contains(target)) return;
        if (document.activeElement !== el && target !== el) return;
        requestAnimationFrame(() => syncFromSelection());
      };

      const onKeyUp = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeMenu();
          return;
        }
        requestAnimationFrame(() => syncFromSelection());
      };

      const onSelect = () => {
        requestAnimationFrame(() => syncFromSelection({ allowClear: false }));
      };

      // 스크롤해도 닫지 않음 — 모바일 선택 시 OS 스크롤이 잦음
      const onScroll = () => {
        const selection = readSelection(el);
        if (!selection) return;
        placeMenu(
          selection,
          menuRef.current
            ? {
                width: menuRef.current.getBoundingClientRect().width,
                height: menuRef.current.getBoundingClientRect().height,
              }
            : undefined,
        );
      };

      const onSelectionChange = () => {
        if (document.activeElement !== el) return;
        requestAnimationFrame(() => syncFromSelection({ allowClear: false }));
      };

      const onVisualViewportChange = () => {
        const selection = readSelection(el) ?? menuSelectionRef.current;
        if (!selection) return;
        if (!readSelection(el)) return;
        placeMenu(
          selection,
          menuRef.current
            ? {
                width: menuRef.current.getBoundingClientRect().width,
                height: menuRef.current.getBoundingClientRect().height,
              }
            : undefined,
        );
      };

      const onFocusOut = () => {
        // 메뉴 버튼 탭 시 포커스가 잠깐 빠질 수 있음
        window.setTimeout(() => {
          if (menuRef.current?.contains(document.activeElement)) return;
          if (document.activeElement === el) return;
          const selection = readSelection(el);
          if (!selection) closeMenu();
        }, 0);
      };

      el.addEventListener("mouseup", onMouseUp);
      el.addEventListener("keyup", onKeyUp);
      el.addEventListener("select", onSelect);
      el.addEventListener("scroll", onScroll, { passive: true });
      el.addEventListener("focusout", onFocusOut);
      document.addEventListener("touchend", onDocTouchEnd, {
        capture: true,
        passive: true,
      });
      document.addEventListener("pointerup", onDocPointerUp, true);
      document.addEventListener("selectionchange", onSelectionChange);
      window.visualViewport?.addEventListener("resize", onVisualViewportChange);
      window.visualViewport?.addEventListener("scroll", onVisualViewportChange);
      window.addEventListener("resize", onVisualViewportChange);

      return () => {
        el.removeEventListener("mouseup", onMouseUp);
        el.removeEventListener("keyup", onKeyUp);
        el.removeEventListener("select", onSelect);
        el.removeEventListener("scroll", onScroll);
        el.removeEventListener("focusout", onFocusOut);
        document.removeEventListener("touchend", onDocTouchEnd, true);
        document.removeEventListener("pointerup", onDocPointerUp, true);
        document.removeEventListener("selectionchange", onSelectionChange);
        window.visualViewport?.removeEventListener(
          "resize",
          onVisualViewportChange,
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          onVisualViewportChange,
        );
        window.removeEventListener("resize", onVisualViewportChange);
      };
    };

    const tryAttach = () => {
      const next = textareaRef.current;
      if (!next || cancelled) return false;
      detach = attach(next);
      return true;
    };

    if (!tryAttach()) {
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
      clearClearTimer();
      detach?.();
    };
  }, [
    clearClearTimer,
    clearTouchSyncTimers,
    closeMenu,
    enabled,
    placeMenu,
    syncAfterTouch,
    syncFromSelection,
    textareaRef,
  ]);

  const runAction = useCallback(
    (actionId: string, ctx: QuickActionContext) => {
      void engine.run(actionId, ctx).then(() => {
        closeMenu();
      });
    },
    [closeMenu, engine],
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
        "fixed z-[9999] flex max-w-[calc(100vw-16px)] flex-nowrap items-center gap-1 overflow-x-auto",
        "rounded-full border border-ns-border bg-ns-surface",
        "px-1 py-1 shadow-ns-md",
        "[-webkit-overflow-scrolling:touch]",
        menu.docked && "shadow-lg",
      )}
      style={{ top: menu.top, left: menu.left }}
      role="toolbar"
      aria-label="Quick Actions"
      data-quick-actions-menu=""
      data-docked={menu.docked ? "true" : "false"}
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
