"use client";

/**
 * =============================================================================
 * MobileQuickActionsBar
 * -----------------------------------------------------------------------------
 * 모바일 Selection Action Menu.
 *
 * - 선택(드래그)한 글자 **조금 위**에 fixed 로 띄운다
 * - 하단 풀폭 바보다 작게 (컴팩트 칩)
 * - pointerdown + preventDefault 로 선택 해제 방지
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
import {
  decideSelectionMenuPlacement,
  getTextareaSelectionBoundingClientRect,
  SELECTION_MENU_GAP_PX,
  SELECTION_MENU_VIEWPORT_PAD_PX,
} from "@/features/quick-actions/lib/position";
import type {
  QuickAction,
  QuickActionSelection,
} from "@/features/quick-actions/types";
import { cn } from "@/lib/utils/cn";

export interface MobileQuickActionsBarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  engine: ActionEngine;
  enabled?: boolean;
}

interface MenuPos {
  top: number;
  left: number;
}

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

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(max-width: 767px)").matches;
  } catch {
    return window.innerWidth < 768;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 선택 바로 위(또는 공간 없으면 아래) — viewport fixed 좌표 */
function computeMenuPos(
  el: HTMLTextAreaElement,
  selection: QuickActionSelection,
  menuWidth: number,
  menuHeight: number,
): MenuPos {
  const rect = getTextareaSelectionBoundingClientRect(
    el,
    selection.start,
    selection.end,
  );
  const vv = window.visualViewport;
  const offsetTop = vv?.offsetTop ?? 0;
  const offsetLeft = vv?.offsetLeft ?? 0;
  const viewportW = vv?.width ?? window.innerWidth;
  const viewportH = vv?.height ?? window.innerHeight;
  const pad = SELECTION_MENU_VIEWPORT_PAD_PX;
  // 선택과 메뉴 사이 — “조금 위”
  const gap = Math.max(4, SELECTION_MENU_GAP_PX - 2);

  const { menuTopViewport } = decideSelectionMenuPlacement({
    selectionTop: rect.top,
    selectionBottom: rect.bottom,
    menuHeight,
    viewportH: offsetTop + viewportH,
    gap,
    viewportPad: pad + offsetTop,
  });

  const selectionCenterX = rect.left + rect.width / 2;
  let left = selectionCenterX - menuWidth / 2;
  left = clamp(
    left,
    offsetLeft + pad,
    offsetLeft + Math.max(pad, viewportW - menuWidth - pad),
  );

  const top = clamp(
    menuTopViewport,
    offsetTop + pad,
    offsetTop + Math.max(pad, viewportH - menuHeight - pad),
  );

  return { top, left };
}

export function MobileQuickActionsBar({
  textareaRef,
  engine,
  enabled = true,
}: MobileQuickActionsBarProps) {
  const [selection, setSelection] = useState<QuickActionSelection | null>(
    null,
  );
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const place = useCallback(
    (next: QuickActionSelection) => {
      const el = textareaRef.current;
      if (!el) return;
      const measured = menuRef.current?.getBoundingClientRect();
      // 컴팩트 메뉴 기본 추정 크기
      const width = measured && measured.width > 8 ? measured.width : 220;
      const height = measured && measured.height > 8 ? measured.height : 36;
      setPos(computeMenuPos(el, next, width, height));
    },
    [textareaRef],
  );

  const sync = useCallback(() => {
    if (!enabled || !isMobileViewport()) {
      setSelection(null);
      setPos(null);
      return;
    }
    const live = readSelection(textareaRef.current);
    if (!live) {
      setSelection(null);
      setPos(null);
      return;
    }
    setSelection((prev) => {
      if (
        prev &&
        prev.start === live.start &&
        prev.end === live.end &&
        prev.text === live.text
      ) {
        return prev;
      }
      return live;
    });
    place(live);
  }, [enabled, place, textareaRef]);

  useEffect(() => {
    setMounted(true);
    const updateMobile = () => setMobile(isMobileViewport());
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    if (!enabled || !mobile) {
      setSelection(null);
      setPos(null);
      return;
    }

    const el = textareaRef.current;
    let rafId = 0;
    const scheduleSync = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        sync();
      });
    };

    const onAny = () => {
      scheduleSync();
      window.setTimeout(scheduleSync, 80);
    };

    // 선택이 있을 때만 폴링 — 상시 200ms 폴링 제거
    let pollTimer: number | null = null;
    const startPoll = () => {
      if (pollTimer != null) return;
      pollTimer = window.setInterval(() => {
        const live = readSelection(textareaRef.current);
        if (!live) {
          if (pollTimer != null) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
          setSelection(null);
          setPos(null);
          return;
        }
        sync();
      }, 200);
    };

    const onSelectionChange = () => {
      const target = textareaRef.current;
      if (!target) return;
      if (document.activeElement !== target && !readSelection(target)) return;
      if (target.selectionStart === target.selectionEnd) {
        scheduleSync();
        return;
      }
      startPoll();
      scheduleSync();
    };

    el?.addEventListener("select", onAny);
    el?.addEventListener("keyup", onAny);
    el?.addEventListener("mouseup", onAny);
    el?.addEventListener("touchend", onAny, { passive: true });
    el?.addEventListener("focus", onAny);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("touchend", onAny, {
      capture: true,
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("scroll", scheduleSync);
    window.addEventListener("scroll", scheduleSync, true);

    if (readSelection(el)) {
      startPoll();
      scheduleSync();
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (pollTimer != null) window.clearInterval(pollTimer);
      el?.removeEventListener("select", onAny);
      el?.removeEventListener("keyup", onAny);
      el?.removeEventListener("mouseup", onAny);
      el?.removeEventListener("touchend", onAny);
      el?.removeEventListener("focus", onAny);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("touchend", onAny, true);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("scroll", scheduleSync, true);
    };
  }, [enabled, mobile, sync, textareaRef]);

  const actions: QuickAction[] = useMemo(() => {
    if (!selection) return [];
    return engine.getAvailableActions({
      selection,
      textarea: textareaRef.current,
    });
  }, [engine, selection, textareaRef]);

  // 실제 렌더 크기로 위치 보정 (선택 바로 위)
  useLayoutEffect(() => {
    if (!selection || !menuRef.current) return;
    place(selection);
  }, [selection, place, actions.length]);

  const runAction = useCallback(
    (actionId: string) => {
      const el = textareaRef.current;
      const live = readSelection(el);
      if (!live || !el) return;
      void engine.run(actionId, {
        selection: live,
        textarea: el,
      });
      if (actionId === "highlight") {
        requestAnimationFrame(() => {
          const target = textareaRef.current;
          if (!target) return;
          try {
            target.focus();
            target.setSelectionRange(live.end, live.end);
          } catch {
            // ignore
          }
          sync();
        });
      } else {
        window.setTimeout(sync, 40);
        window.setTimeout(sync, 160);
      }
    },
    [engine, sync, textareaRef],
  );

  const guardPointer = (
    event: React.PointerEvent | React.TouchEvent | React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (!enabled || !mobile || !mounted || !selection || !pos || actions.length === 0) {
    return null;
  }

  const bar = (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100] md:hidden",
        "flex max-w-[calc(100vw-16px)] flex-nowrap items-center gap-0.5",
        "overflow-x-auto rounded-full border border-ns-border",
        "bg-ns-surface/95 px-0.5 py-0.5 shadow-ns-sm backdrop-blur-sm",
        "[-webkit-overflow-scrolling:touch]",
      )}
      style={{ top: pos.top, left: pos.left }}
      role="toolbar"
      aria-label="Mobile Quick Actions"
      data-mobile-quick-actions=""
    >
      {actions.map((action) => {
        const isHighlight = action.id === "highlight";
        return (
          <button
            key={action.id}
            type="button"
            data-quick-action={action.id}
            className={cn(
              // 현재보다 작게: min-h-11(44) → 32, text-sm → xs, padding 축소
              "inline-flex h-8 shrink-0 items-center justify-center gap-1",
              "rounded-full px-2 text-[11px] font-medium leading-none text-ns-ink",
              "active:bg-ns-muted",
              "focus-visible:outline-none focus-visible:shadow-[var(--ns-ring-accent)]",
              isHighlight && "bg-[#BFE8FF] active:bg-[#A8DEFF]",
            )}
            onPointerDown={(event) => {
              guardPointer(event);
              runAction(action.id);
            }}
            onTouchStart={(event) => {
              guardPointer(event);
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <span aria-hidden className="text-[12px] leading-none">
              {action.icon}
            </span>
            <span className="whitespace-nowrap">{action.label}</span>
          </button>
        );
      })}
    </div>
  );

  return createPortal(bar, document.body);
}
