"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * 큰 plain-text 원고 에디터.
 * - 검색 점프를 위해 ref + setSelectionRange 지원
 * - 서식 엔진 없이 textarea로 유지 (확장 여지)
 * =============================================================================
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Document 제목 — placeholder/aria에 사용 */
  documentTitle?: string;
  disabled?: boolean;
  className?: string;
}

export const ManuscriptEditor = forwardRef<
  HTMLTextAreaElement,
  ManuscriptEditorProps
>(function ManuscriptEditor(
  { value, onChange, documentTitle, disabled, className },
  ref,
) {
  return (
    <textarea
      ref={ref}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      spellCheck
      aria-label={
        documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
      }
      placeholder="여기에 원고를 작성하세요…"
      className={cn(
        "min-h-[28rem] w-full flex-1 resize-y rounded-ns-lg border border-ns-border bg-ns-surface",
        "px-ns-5 py-ns-5 text-ns-base leading-ns-relaxed text-ns-ink",
        "placeholder:text-ns-ink-tertiary",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-ns-border-strong",
        "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
        "disabled:cursor-not-allowed disabled:bg-ns-muted",
        className,
      )}
    />
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
