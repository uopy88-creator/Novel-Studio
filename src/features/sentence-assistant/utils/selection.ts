/**
 * 원고 textarea 선택 범위 읽기
 */

import type { SentenceSelection } from "@/features/sentence-assistant/types";

export function readTextareaSelection(
  el: HTMLTextAreaElement | null,
): SentenceSelection | null {
  if (!el) return null;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  if (start === end) return null;
  const text = el.value.slice(start, end);
  if (!text.trim()) return null;
  return { text, start, end };
}
