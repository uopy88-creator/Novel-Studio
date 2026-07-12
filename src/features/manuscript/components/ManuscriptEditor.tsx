"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * 큰 plain-text 원고 에디터.
 * - 검색 점프를 위해 ref + setSelectionRange 지원
 * - @멘션 자동완성을 위해 키보드/클릭/선택/IME 핸들러 전달 가능
 *
 * TODO:
 * Implement lightweight text annotations without affecting typing performance.
 * =============================================================================
 */

import {
  forwardRef,
  type CompositionEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactEventHandler,
} from "react";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  documentTitle?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>;
  onClick?: MouseEventHandler<HTMLTextAreaElement>;
  onSelect?: ReactEventHandler<HTMLTextAreaElement>;
  onCompositionStart?: CompositionEventHandler<HTMLTextAreaElement>;
  onCompositionEnd?: CompositionEventHandler<HTMLTextAreaElement>;
  onMouseUp?: MouseEventHandler<HTMLTextAreaElement>;
  onScroll?: ReactEventHandler<HTMLTextAreaElement>;
}

export const ManuscriptEditor = forwardRef<
  HTMLTextAreaElement,
  ManuscriptEditorProps
>(function ManuscriptEditor(
  {
    value,
    onChange,
    documentTitle,
    disabled,
    className,
    onKeyDown,
    onKeyUp,
    onClick,
    onSelect,
    onCompositionStart,
    onCompositionEnd,
    onMouseUp,
    onScroll,
  },
  ref,
) {
  return (
    <textarea
      ref={ref}
      data-manuscript-editor=""
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onClick={onClick}
      onSelect={onSelect}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onMouseUp={onMouseUp}
      onScroll={onScroll}
      spellCheck
      aria-label={
        documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
      }
      placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
      className={cn(
        "min-h-[28rem] w-full flex-1 resize-y rounded-ns-lg border border-ns-border bg-ns-surface",
        "px-ns-5 py-ns-5 leading-ns-relaxed text-ns-ink",
        "placeholder:text-ns-ink-tertiary",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-ns-border-strong",
        "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
        "disabled:cursor-not-allowed disabled:bg-ns-muted",
        className,
      )}
      style={{ fontSize: "var(--ns-editor-font-size, 1rem)" }}
    />
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
