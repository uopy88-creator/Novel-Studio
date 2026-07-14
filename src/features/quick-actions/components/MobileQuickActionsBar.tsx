"use client";

/**
 * =============================================================================
 * MobileQuickActionsBar
 * -----------------------------------------------------------------------------
 * 모바일에서 Selection Action Menu(포털 floating) 대신 쓰는 고정 액션 바.
 *
 * 왜 필요한가
 * - iOS/Android textarea 는 네이티브 선택 핸들·콜아웃 때문에 floating 메뉴가
 *   자주 실패하거나 가려진다.
 * - 선택이 생기면 visualViewport 하단에 도킹된 바를 띄워 Highlight 를 바로 누른다.
 * - pointerdown / touchstart 에서 preventDefault 로 선택 해제를 막는다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ActionEngine } from "@/features/quick-actions/engine/ActionEngine";
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
  // Tailwind `md` 와 동일 — 폰만 하단 바, 태블릿+는 데스크톱 메뉴
  try {
    return window.matchMedia("(max-width: 767px)").matches;
  } catch {
    return window.innerWidth < 768;
  }
}

export function MobileQuickActionsBar({
  textareaRef,
  engine,
  enabled = true,
}: MobileQuickActionsBarProps) {
  const [selection, setSelection] = useState<QuickActionSelection | null>(
    null,
  );
  const [dockBottom, setDockBottom] = useState(12);
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  const sync = useCallback(() => {
    if (!enabled || !isMobileViewport()) {
      setSelection(null);
      return;
    }
    setSelection(readSelection(textareaRef.current));
  }, [enabled, textareaRef]);

  const syncDock = useCallback(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) {
      setDockBottom(12);
      return;
    }
    // 키보드·브라우저 UI 위로 올리기
    const gap = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
    setDockBottom(gap + 12);
  }, []);

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
      return;
    }

    const el = textareaRef.current;
    const onAny = () => {
      window.setTimeout(sync, 0);
      window.setTimeout(sync, 80);
      window.setTimeout(sync, 250);
      syncDock();
    };

    // 선택 핸들 드래그 중에도 상태를 잃지 않도록 짧게 폴링
    const timer = window.setInterval(sync, 200);
    el?.addEventListener("select", onAny);
    el?.addEventListener("keyup", onAny);
    el?.addEventListener("mouseup", onAny);
    el?.addEventListener("touchend", onAny, { passive: true });
    el?.addEventListener("focus", onAny);
    document.addEventListener("selectionchange", onAny);
    document.addEventListener("touchend", onAny, {
      capture: true,
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", syncDock);
    window.visualViewport?.addEventListener("scroll", syncDock);
    syncDock();

    return () => {
      window.clearInterval(timer);
      el?.removeEventListener("select", onAny);
      el?.removeEventListener("keyup", onAny);
      el?.removeEventListener("mouseup", onAny);
      el?.removeEventListener("touchend", onAny);
      el?.removeEventListener("focus", onAny);
      document.removeEventListener("selectionchange", onAny);
      document.removeEventListener("touchend", onAny, true);
      window.visualViewport?.removeEventListener("resize", syncDock);
      window.visualViewport?.removeEventListener("scroll", syncDock);
    };
  }, [enabled, mobile, sync, syncDock, textareaRef]);

  const actions: QuickAction[] = useMemo(() => {
    const ctx = {
      selection: selection ?? { text: " ", start: 0, end: 1 },
      textarea: textareaRef.current,
    };
    return engine.getAvailableActions(ctx);
  }, [engine, selection, textareaRef]);

  const runAction = useCallback(
    (actionId: string) => {
      const el = textareaRef.current;
      const live = readSelection(el);
      if (!live || !el) return;
      // 선택이 풀리기 전에 즉시 실행
      void engine.run(actionId, {
        selection: live,
        textarea: el,
      });
      // Highlight 후 선택을 접어 하늘색 오버레이가 바로 보이게 (iOS)
      if (actionId === "highlight") {
        requestAnimationFrame(() => {
          const target = textareaRef.current;
          if (!target) return;
          try {
            const end = live.end;
            target.focus();
            target.setSelectionRange(end, end);
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
    // 선택 해제 방지 — iOS 핵심
    event.preventDefault();
    event.stopPropagation();
  };

  if (!enabled || !mobile || !mounted || !selection) return null;

  const bar = (
    <div
      className={cn(
        "fixed inset-x-0 z-[100] px-3 md:hidden",
        "pointer-events-none",
      )}
      style={{
        bottom: `calc(${dockBottom}px + env(safe-area-inset-bottom, 0px))`,
      }}
      role="toolbar"
      aria-label="Mobile Quick Actions"
      data-mobile-quick-actions=""
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex w-full max-w-lg",
          "flex-nowrap items-center gap-1 overflow-x-auto",
          "rounded-2xl border border-ns-border bg-ns-surface/95 px-1.5 py-1.5",
          "shadow-ns-md backdrop-blur-sm",
          "[-webkit-overflow-scrolling:touch]",
        )}
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
                "rounded-full px-3.5 text-sm font-medium text-ns-ink",
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
                // pointerdown 에서 이미 실행 — 이중 실행 방지
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <span aria-hidden>{action.icon}</span>
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(bar, document.body);
}
