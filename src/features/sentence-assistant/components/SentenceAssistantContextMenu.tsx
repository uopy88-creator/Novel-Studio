"use client";

/**
 * =============================================================================
 * SentenceAssistantContextMenu
 * -----------------------------------------------------------------------------
 * 원고 우클릭 시 「Sentence Assistant」 항목만 보여 주는 가벼운 메뉴.
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface SentenceAssistantContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  onOpenAssistant: () => void;
  onClose: () => void;
}

export function SentenceAssistantContextMenu({
  open,
  x,
  y,
  onOpenAssistant,
  onClose,
}: SentenceAssistantContextMenuProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[51]"
        aria-label="메뉴 닫기"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        className={cn(
          "fixed z-[52] min-w-[11rem] overflow-hidden rounded-ns-md border border-ns-border",
          "bg-ns-surface py-ns-1 shadow-ns-lg",
        )}
        style={{
          left: x,
          top: y,
          maxWidth: "calc(100vw - 1rem)",
        }}
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-ns-2 px-ns-3 py-ns-2 text-left text-ns-sm text-ns-ink hover:bg-ns-muted"
          onClick={onOpenAssistant}
        >
          <span aria-hidden>✍</span>
          <span>Sentence Assistant</span>
        </button>
      </div>
    </>
  );
}
