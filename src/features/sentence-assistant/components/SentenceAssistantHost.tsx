"use client";

/**
 * =============================================================================
 * SentenceAssistantHost
 * -----------------------------------------------------------------------------
 * Manuscript textarea에 우클릭 · Ctrl+Shift+Space 를 연결하고
 * Side Panel 을 띄운다.
 *
 * 「표현 바꾸기」Chip 클릭 시 선택 구간을 유의어로 교체한다.
 * 교체는 setContentTransactional 경로로 들어가 Undo/Redo 가 동작한다.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { SentenceAssistantPanel } from "@/features/sentence-assistant/components/SentenceAssistantPanel";
import { SentenceAssistantContextMenu } from "@/features/sentence-assistant/components/SentenceAssistantContextMenu";
import { readTextareaSelection } from "@/features/sentence-assistant/lib/selection";
import type { SentenceSelection } from "@/features/sentence-assistant/types";

export interface SentenceAssistantHostProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  enabled?: boolean;
  /**
   * 유의어 교체 적용.
   * nextContent 전체를 transactional 로 저장하고,
   * 새 선택 구간(start~end)을 유지한다.
   */
  onReplaceSelection?: (
    nextContent: string,
    selectionStart: number,
    selectionEnd: number,
  ) => void;
}

export function SentenceAssistantHost({
  textareaRef,
  enabled = true,
  onReplaceSelection,
}: SentenceAssistantHostProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selection, setSelection] = useState<SentenceSelection | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const openPanelFromSelection = useCallback(() => {
    const next = readTextareaSelection(textareaRef.current);
    if (!next) return false;
    setSelection(next);
    setPanelOpen(true);
    setMenu(null);
    return true;
  }, [textareaRef]);

  /**
   * Chip → 선택 단어를 synonym 으로 교체.
   * 커서/선택은 교체된 유의어 구간으로 유지한다.
   */
  const handleReplaceWith = useCallback(
    (synonym: string) => {
      const el = textareaRef.current;
      if (!el || !selection || !onReplaceSelection) return;

      const { start, end } = selection;
      // 패널을 연 뒤 본문이 바뀌었으면, 가능한 경우 현재 선택으로 보정
      const live = readTextareaSelection(el);
      const rangeStart = live?.start ?? start;
      const rangeEnd = live?.end ?? end;

      const value = el.value;
      if (rangeStart < 0 || rangeEnd > value.length || rangeStart > rangeEnd) {
        return;
      }

      const nextContent =
        value.slice(0, rangeStart) + synonym + value.slice(rangeEnd);
      const newStart = rangeStart;
      const newEnd = rangeStart + synonym.length;

      onReplaceSelection(nextContent, newStart, newEnd);

      // 패널 표시 단어도 교체 결과로 갱신 (연속 교체 가능)
      setSelection({
        text: synonym,
        start: newStart,
        end: newEnd,
      });

      requestAnimationFrame(() => {
        const editor = textareaRef.current;
        if (!editor) return;
        editor.focus();
        editor.setSelectionRange(newStart, newEnd);
      });
    },
    [onReplaceSelection, selection, textareaRef],
  );

  // 우클릭 메뉴
  useEffect(() => {
    if (!enabled) return;
    const el = textareaRef.current;
    if (!el) return;

    const onContextMenu = (event: MouseEvent) => {
      const current = readTextareaSelection(el);
      if (!current) return; // 선택 없으면 브라우저 기본 메뉴
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
        selectedText={selection?.text ?? ""}
        onReplaceWith={handleReplaceWith}
      />
    </>
  );
}
