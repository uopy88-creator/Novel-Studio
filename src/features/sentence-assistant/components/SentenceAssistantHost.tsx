"use client";

/**
 * =============================================================================
 * SentenceAssistantHost
 * -----------------------------------------------------------------------------
 * Manuscript textarea에 우클릭 · Ctrl+Shift+Space 를 연결하고
 * Side Panel 골격을 띄운다.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { SentenceAssistantPanel } from "@/features/sentence-assistant/components/SentenceAssistantPanel";
import { SentenceAssistantContextMenu } from "@/features/sentence-assistant/components/SentenceAssistantContextMenu";
import { readTextareaSelection } from "@/features/sentence-assistant/lib/selection";

export interface SentenceAssistantHostProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  enabled?: boolean;
}

export function SentenceAssistantHost({
  textareaRef,
  enabled = true,
}: SentenceAssistantHostProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const openPanelFromSelection = useCallback(() => {
    const selection = readTextareaSelection(textareaRef.current);
    if (!selection) return false;
    setSelectedText(selection.text);
    setPanelOpen(true);
    setMenu(null);
    return true;
  }, [textareaRef]);

  // 우클릭 메뉴
  useEffect(() => {
    if (!enabled) return;
    const el = textareaRef.current;
    if (!el) return;

    const onContextMenu = (event: MouseEvent) => {
      const selection = readTextareaSelection(el);
      if (!selection) return; // 선택 없으면 브라우저 기본 메뉴
      event.preventDefault();
      const pad = 8;
      const menuW = 200;
      const menuH = 48;
      const x = Math.min(
        event.clientX,
        window.innerWidth - menuW - pad,
      );
      const y = Math.min(
        event.clientY,
        window.innerHeight - menuH - pad,
      );
      setMenu({ x: Math.max(pad, x), y: Math.max(pad, y) });
    };

    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [enabled, textareaRef]);

  // Ctrl+Shift+Space / ⌘+Shift+Space
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod || !event.shiftKey) return;
      if (event.code !== "Space" && event.key !== " ") return;

      const el = textareaRef.current;
      const active = document.activeElement;
      // 에디터 포커스이거나, 선택만 유지된 경우에도 허용
      if (el && active !== el && !readTextareaSelection(el)) return;

      event.preventDefault();
      openPanelFromSelection();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, openPanelFromSelection, textareaRef]);

  return (
    <>
      <SentenceAssistantContextMenu
        open={Boolean(menu)}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        onClose={() => setMenu(null)}
        onOpenAssistant={() => {
          openPanelFromSelection();
        }}
      />
      <SentenceAssistantPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        selectedText={selectedText}
      />
    </>
  );
}
