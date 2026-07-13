"use client";

/**
 * =============================================================================
 * InspirationSelectionMenu (legacy UI)
 * -----------------------------------------------------------------------------
 * Manuscript 선택 UI 는 Quick Actions (`@/features/quick-actions`) 로 통합되었다.
 * TextSelectionRange 타입과 하위 호환을 위해 컴포넌트는 유지한다.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextSelectionRange {
  text: string;
  start: number;
  end: number;
}

export interface InspirationSelectionMenuProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  enabled: boolean;
  onAddInspiration: (selection: TextSelectionRange) => void;
}

export function InspirationSelectionMenu({
  textareaRef,
  enabled,
  onAddInspiration,
}: InspirationSelectionMenuProps) {
  const [menu, setMenu] = useState<{
    top: number;
    left: number;
    selection: TextSelectionRange;
  } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMenu(null);
      return;
    }

    const el = textareaRef.current;
    if (!el) return;

    const updateFromSelection = () => {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start === end) {
        setMenu(null);
        return;
      }

      const text = el.value.slice(start, end);
      if (!text.trim()) {
        setMenu(null);
        return;
      }

      // textarea 좌표 기준으로 대략적인 메뉴 위치 (선택 끝 근처)
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(style.lineHeight) || 28;
      const paddingTop = Number.parseFloat(style.paddingTop) || 0;
      const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;

      const before = el.value.slice(0, start);
      const lines = before.split("\n");
      const lineIndex = lines.length - 1;
      const col = lines[lines.length - 1]?.length ?? 0;

      // 스크롤을 반영한 상대 좌표
      const top =
        paddingTop +
        lineIndex * lineHeight -
        el.scrollTop +
        lineHeight +
        4;
      const left = Math.min(
        paddingLeft + Math.min(col, 24) * 8 - el.scrollLeft,
        rect.width - 140,
      );

      setMenu({
        top: Math.max(8, top),
        left: Math.max(8, left),
        selection: { text, start, end },
      });
    };

    const onMouseUp = () => {
      // 선택 확정 후
      requestAnimationFrame(updateFromSelection);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
        return;
      }
      requestAnimationFrame(updateFromSelection);
    };

    const onScroll = () => setMenu(null);

    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, [enabled, textareaRef]);

  if (!menu) return null;

  return (
    <div
      className={cn(
        "absolute z-30 rounded-ns-full border border-ns-border bg-ns-surface",
        "px-ns-1 py-ns-1 shadow-ns-md",
      )}
      style={{ top: menu.top, left: menu.left }}
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        className="inline-flex min-h-9 items-center gap-ns-2 rounded-ns-full px-ns-3 text-ns-sm font-medium text-ns-ink hover:bg-ns-muted"
        onMouseDown={(event) => {
          // textarea 포커스/선택 유지를 위해 preventDefault
          event.preventDefault();
          onAddInspiration(menu.selection);
          setMenu(null);
        }}
      >
        <span aria-hidden>💡</span>
        영감 추가
      </button>
    </div>
  );
}
