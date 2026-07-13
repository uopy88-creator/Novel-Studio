"use client";

/**
 * =============================================================================
 * SentenceAssistantHost
 * -----------------------------------------------------------------------------
 * Manuscript textarea에 우클릭 · Ctrl+Shift+Space 를 연결하고
 * Side Panel 을 띄운다.
 *
 * 「표현 바꾸기」Chip 클릭 시:
 * - 선택 위치의 단어만 교체 (동일 문자열이 있어도 그 오프셋만)
 * - setContentTransactional → Undo/Redo · 자동 저장 경로 유지
 * - 내부 selection 은 새 단어 구간으로 갱신, 커서는 단어 뒤에 둠
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { SentenceAssistantPanel } from "@/features/sentence-assistant/components/SentenceAssistantPanel";
import { SentenceAssistantContextMenu } from "@/features/sentence-assistant/components/SentenceAssistantContextMenu";
import { readTextareaSelection } from "@/features/sentence-assistant/utils/selection";
import type { SentenceSelection } from "@/features/sentence-assistant/types";

export interface SentenceAssistantHostProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  enabled?: boolean;
  /**
   * 유의어 교체 적용.
   * nextContent 는 transactional 저장.
   * caretStart/caretEnd — 보통 교체 단어 끝의 collapsed caret.
   */
  onReplaceSelection?: (
    nextContent: string,
    caretStart: number,
    caretEnd: number,
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
   * - 패널용 selection: 새 단어 [start, end)
   * - textarea caret: end 위치 (단어 뒤)
   */
  const handleReplaceWith = useCallback(
    (synonym: string) => {
      const el = textareaRef.current;
      if (!el || !selection || !onReplaceSelection) return;

      const { start, end, text } = selection;
      // 패널을 연 시점의 오프셋을 우선 사용 (같은 단어가 여러 곳이어도 그 위치만)
      let rangeStart = start;
      let rangeEnd = end;

      // 라이브 선택이 있고, 이전에 기억한 텍스트와 같으면 라이브 오프셋 사용
      const live = readTextareaSelection(el);
      if (live && live.text === text) {
        rangeStart = live.start;
        rangeEnd = live.end;
      } else if (el.value.slice(start, end) !== text) {
        // 본문이 어긋났으면 기억한 텍스트를 해당 오프셋 근처에서 재탐색
        const found = el.value.indexOf(text, Math.max(0, start - 32));
        if (found >= 0) {
          rangeStart = found;
          rangeEnd = found + text.length;
        }
      }

      const value = el.value;
      if (
        rangeStart < 0 ||
        rangeEnd > value.length ||
        rangeStart > rangeEnd
      ) {
        return;
      }

      // 선택 구간만 splice — 전체 Manuscript 트리를 remount 하지 않음
      const nextContent =
        value.slice(0, rangeStart) + synonym + value.slice(rangeEnd);
      const newStart = rangeStart;
      const newEnd = rangeStart + synonym.length;

      onReplaceSelection(nextContent, newEnd, newEnd);

      setSelection({
        text: synonym,
        start: newStart,
        end: newEnd,
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
      if (!current) return;
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
