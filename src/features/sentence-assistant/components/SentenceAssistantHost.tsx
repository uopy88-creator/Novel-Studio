"use client";

/**
 * =============================================================================
 * SentenceAssistantHost
 * -----------------------------------------------------------------------------
 * Manuscript textarea에 우클릭 · Ctrl+Shift+Space 를 연결하고
 * Side Panel 을 띄운다.
 *
 * Quick Actions 는 Action Engine 을 통해 `openFromSelection` 을 호출한다.
 * (Host 를 UI에서 직접 호출하지 않음 — Action 구현이 ref 로 위임)
 * =============================================================================
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { SentenceAssistantPanel } from "@/features/sentence-assistant/components/SentenceAssistantPanel";
import { SentenceAssistantContextMenu } from "@/features/sentence-assistant/components/SentenceAssistantContextMenu";
import { readTextareaSelection } from "@/features/sentence-assistant/utils/selection";
import type { SentenceSelection } from "@/features/sentence-assistant/types";
import type { ProjectId } from "@/types/ids";
import { useSectionRegistry } from "@/features/sections";

export interface SentenceAssistantHostProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Section Registry 구독용 — Manuscript 가 관리하는 SSOT 와 동기화 */
  projectId?: ProjectId;
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

/** Quick Actions / 외부 Action 이 호출하는 핸들 */
export interface SentenceAssistantHostHandle {
  /**
   * 패널 열기.
   * selection 을 넘기면 그 범위를 사용하고, 없으면 textarea 현재 선택.
   */
  openFromSelection: (selection?: SentenceSelection) => boolean;
}

export const SentenceAssistantHost = forwardRef<
  SentenceAssistantHostHandle,
  SentenceAssistantHostProps
>(function SentenceAssistantHost(
  { textareaRef, projectId, enabled = true, onReplaceSelection },
  ref,
) {
  // Section Registry 구독 — Manuscript SSOT 와 동일 데이터 (읽기 전용)
  useSectionRegistry((projectId ?? "") as ProjectId);

  const [panelOpen, setPanelOpen] = useState(false);
  const [selection, setSelection] = useState<SentenceSelection | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const openPanelFromSelection = useCallback(
    (forced?: SentenceSelection) => {
      const next = forced ?? readTextareaSelection(textareaRef.current);
      if (!next) return false;
      setSelection(next);
      setPanelOpen(true);
      setMenu(null);
      return true;
    },
    [textareaRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      openFromSelection: openPanelFromSelection,
    }),
    [openPanelFromSelection],
  );

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
      let rangeStart = start;
      let rangeEnd = end;

      const live = readTextareaSelection(el);
      if (live && live.text === text) {
        rangeStart = live.start;
        rangeEnd = live.end;
      } else if (el.value.slice(start, end) !== text) {
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

  // 우클릭 메뉴 (브라우저 기본 메뉴는 선택 없을 때 유지)
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
      const x = Math.min(event.clientX, window.innerWidth - menuW - pad);
      const y = Math.min(event.clientY, window.innerHeight - menuH - pad);
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
});
