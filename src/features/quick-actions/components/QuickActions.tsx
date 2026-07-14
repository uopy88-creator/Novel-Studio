"use client";

/**
 * =============================================================================
 * Quick Actions UI (Selection Action Menu)
 * -----------------------------------------------------------------------------
 * - Registry → 버튼 자동 생성
 * - body 포털 + position:fixed
 *
 * 모바일:
 * - textarea 이벤트만으로는 선택 핸들/스크롤 타이밍을 놓치기 쉬움
 * - focus 중 짧은 폴링으로 selection 을 SSOT 로 본다
 * - 터치·좁은 화면은 visualViewport 하단(safe-area)에 1열 도킹
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
  /** docked 일 때 layout viewport 기준 bottom (keyboard 대응) */
  bottom: number | null;
  selection: QuickActionSelection;
  measured: boolean;
  docked: boolean;
}

const POLL_MS = 200;
const EMPTY_TICKS_BEFORE_CLOSE = 2;

function readSelection(
  el: HTMLTextAreaElement | null,
): QuickActionSelection | null {
  if (!el) return null;
  try {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (typeof start !== "number" || typeof end !== "number") return null;
    if (start === end) return null;
    const text = el.value.slice(start, end);
    if (!text.trim()) return null;
    return { text, start, end };
  } catch {
    return null;
  }
}

function selectionKey(selection: QuickActionSelection): string {
  return `${selection.start}:${selection.end}`;
}

function shouldDockToBottom(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    return coarse || noHover || window.innerWidth < 768;
  } catch {
    return window.innerWidth < 768;
  }
}

function measureMenuBox(menuWidth: number, menuHeight: number, docked: boolean) {
  const vv = window.visualViewport;
  const width = vv?.width ?? window.innerWidth;
  const height = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  const offsetLeft = vv?.offsetLeft ?? 0;
  const pad = 12;
  const usableWidth = Math.min(menuWidth, Math.max(120, width - pad * 2));
  const left = offsetLeft + Math.max(pad, (width - usableWidth) / 2);

  if (docked) {
    // layout viewport 하단에서의 거리 = 키보드 등에 가려지지 않게
    const bottom =
      Math.max(0, window.innerHeight - (offsetTop + height)) + pad;
    return {
      top: offsetTop + height - menuHeight - pad,
      left,
      bottom,
    };
  }

  return { top: 0, left, bottom: null as number | null };
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
  const lastKeyRef = useRef<string | null>(null);
  const emptyTicksRef = useRef(0);
  const selectionRef = useRef<QuickActionSelection | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
    lastKeyRef.current = null;
    selectionRef.current = null;
    emptyTicksRef.current = 0;
  }, []);

  const placeMenu = useCallback(
    (
      selection: QuickActionSelection,
      measuredSize?: { width: number; height: number },
    ) => {
      const el = textareaRef.current;
      if (!el) return;

      const docked = shouldDockToBottom();
      const menuWidth = measuredSize?.width ?? 360;
      const menuHeight = measuredSize?.height ?? 56;

      let top: number;
      let left: number;
      let bottom: number | null;

      if (docked) {
        const box = measureMenuBox(menuWidth, menuHeight, true);
        top = box.top;
        left = box.left;
        bottom = box.bottom;
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
        bottom = null;
      }

      selectionRef.current = selection;
      lastKeyRef.current = selectionKey(selection);
      emptyTicksRef.current = 0;
      setMenu((prev) => {
        // 드래그 중 동일 선택·거의 같은 좌표면 setState 생략
        if (
          prev &&
          prev.selection.start === selection.start &&
          prev.selection.end === selection.end &&
          prev.docked === docked &&
          prev.measured === Boolean(measuredSize) &&
          Math.abs(prev.top - top) < 1 &&
          Math.abs(prev.left - left) < 1 &&
          prev.bottom === bottom
        ) {
          return prev;
        }
        return {
          top,
          left,
          bottom,
          selection,
          measured: Boolean(measuredSize),
          docked,
        };
      });
    },
    [positionParentRef, textareaRef],
  );

  const refreshFromTextarea = useCallback(() => {
    if (!enabled) {
      closeMenu();
      return;
    }
    const el = textareaRef.current;
    if (!el) return;

    const selection = readSelection(el);
    if (selection) {
      const key = selectionKey(selection);
      // 같은 선택이면 위치 재계산 생략 (스크롤·리사이즈는 onViewport 가 처리)
      if (key !== lastKeyRef.current || !menuRef.current) {
        placeMenu(selection);
      }
      return;
    }

    // 선택 없음 — 연속 몇 틱 비어야 닫기 (모바일 깜빡임 방지)
    if (!lastKeyRef.current) return;
    emptyTicksRef.current += 1;
    if (emptyTicksRef.current >= EMPTY_TICKS_BEFORE_CLOSE) {
      closeMenu();
    }
  }, [closeMenu, enabled, placeMenu, textareaRef]);

  // 핵심: focus/선택 중만 폴링 — 타이핑 중 상시 폴링 제거
  useEffect(() => {
    if (!enabled) {
      closeMenu();
      return;
    }

    let rafId = 0;
    const scheduleRefresh = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        refreshFromTextarea();
      });
    };

    const onFocusIn = () => {
      scheduleRefresh();
      startPoll();
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        if (menuRef.current?.contains(document.activeElement)) return;
        if (document.activeElement === el) return;
        if (!readSelection(el)) {
          closeMenu();
          stopPoll();
        }
      }, 50);
    };

    const onDocTouchEnd = () => {
      window.setTimeout(scheduleRefresh, 0);
      window.setTimeout(scheduleRefresh, 100);
    };

    const onMouseUp = () => {
      scheduleRefresh();
    };

    const onSelect = () => {
      scheduleRefresh();
    };

    const onSelectionChange = () => {
      const el = textareaRef.current;
      if (!el) return;
      // 포커스가 없고 메뉴도 없으면 무시 (타이핑 외 전역 selectionchange 폭주 방지)
      if (document.activeElement !== el && !lastKeyRef.current) return;
      // collapsed 선택은 메뉴를 열지 않으므로, 메뉴가 없을 때는 즉시 스킵
      if (
        !lastKeyRef.current &&
        el.selectionStart === el.selectionEnd
      ) {
        return;
      }
      scheduleRefresh();
    };

    const onViewport = () => {
      const selection = selectionRef.current ?? readSelection(textareaRef.current);
      if (!selection || !readSelection(textareaRef.current)) return;
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

    let pollTimer: number | null = null;
    const startPoll = () => {
      if (pollTimer != null) return;
      pollTimer = window.setInterval(() => {
        const el = textareaRef.current;
        if (!el) return;
        if (
          document.activeElement === el ||
          lastKeyRef.current ||
          readSelection(el)
        ) {
          refreshFromTextarea();
        } else {
          stopPoll();
        }
      }, POLL_MS);
    };
    const stopPoll = () => {
      if (pollTimer != null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    // 초기에는 폴링하지 않음 — focus 또는 선택이 있을 때만
    if (
      document.activeElement === textareaRef.current ||
      readSelection(textareaRef.current)
    ) {
      startPoll();
      scheduleRefresh();
    }

    const bind = (el: HTMLTextAreaElement) => {
      el.addEventListener("focus", onFocusIn);
      el.addEventListener("blur", onFocusOut);
      el.addEventListener("mouseup", onMouseUp);
      el.addEventListener("select", onSelect);
      el.addEventListener("keyup", onMouseUp);
      el.addEventListener("touchend", onDocTouchEnd, { passive: true });
    };

    const unbind = (el: HTMLTextAreaElement) => {
      el.removeEventListener("focus", onFocusIn);
      el.removeEventListener("blur", onFocusOut);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("select", onSelect);
      el.removeEventListener("keyup", onMouseUp);
      el.removeEventListener("touchend", onDocTouchEnd);
    };

    let attached: HTMLTextAreaElement | null = null;
    const ensureAttached = () => {
      const el = textareaRef.current;
      if (!el || el === attached) return;
      if (attached) unbind(attached);
      attached = el;
      bind(el);
    };
    ensureAttached();
    const attachTimer = window.setInterval(ensureAttached, 1000);

    document.addEventListener("touchend", onDocTouchEnd, {
      capture: true,
      passive: true,
    });
    document.addEventListener("selectionchange", onSelectionChange);
    window.visualViewport?.addEventListener("resize", onViewport);
    window.visualViewport?.addEventListener("scroll", onViewport);
    window.addEventListener("resize", onViewport);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      stopPoll();
      window.clearInterval(attachTimer);
      if (attached) unbind(attached);
      document.removeEventListener("touchend", onDocTouchEnd, true);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.visualViewport?.removeEventListener("resize", onViewport);
      window.visualViewport?.removeEventListener("scroll", onViewport);
      window.removeEventListener("resize", onViewport);
    };
  }, [closeMenu, enabled, placeMenu, refreshFromTextarea, textareaRef]);

  useLayoutEffect(() => {
    if (!menu || menu.measured || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    placeMenu(menu.selection, { width: rect.width, height: rect.height });
  }, [menu, placeMenu]);

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
        "fixed flex flex-nowrap items-center gap-1 overflow-x-auto",
        "border border-ns-border bg-ns-surface shadow-lg",
        "[-webkit-overflow-scrolling:touch]",
        menu.docked
          ? "left-0 right-0 max-w-none justify-center rounded-none border-x-0 border-b-0 px-2 py-2"
          : "max-w-[calc(100vw-16px)] rounded-full px-1 py-1",
      )}
      style={{
        zIndex: 2147483000,
        ...(menu.docked && menu.bottom != null
          ? {
              left: 0,
              right: 0,
              top: "auto",
              bottom: menu.bottom,
              paddingBottom: "max(8px, env(safe-area-inset-bottom))",
            }
          : {
              top: menu.top,
              left: menu.left,
              bottom: "auto",
            }),
      }}
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
              "hover:bg-ns-muted active:bg-ns-muted",
              "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
              isHighlight &&
                "bg-[#BFE8FF] hover:bg-[#A8DEFF] active:bg-[#A8DEFF]",
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
