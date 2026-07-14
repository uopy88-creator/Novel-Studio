"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * 큰 plain-text 원고 에디터.
 * - 검색 점프를 위해 ref + setSelectionRange 지원
 * - @멘션 자동완성을 위해 키보드/클릭/선택/IME 핸들러 전달 가능
 * - 하늘색 Highlight 는 Selection Menu 토글; grid 오버레이로 표시
 *   (position:relative 래퍼를 쓰면 textarea.offsetParent 가 바뀌어
 *    Quick Actions 위치가 어긋나므로 grid 스택만 사용)
 * =============================================================================
 */

import {
  forwardRef,
  useMemo,
  useRef,
  type CompositionEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactEventHandler,
  type UIEventHandler,
} from "react";
import {
  highlightsToOverlayHtml,
  type HighlightRange,
} from "@/features/manuscript/lib/highlight-marks";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** plain 좌표 Highlight 구간 — 있으면 하늘색 오버레이 표시 */
  highlightRanges?: readonly HighlightRange[];
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
    highlightRanges,
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
  const backdropRef = useRef<HTMLDivElement>(null);
  const hasHighlights = Boolean(highlightRanges && highlightRanges.length > 0);

  const overlayHtml = useMemo(() => {
    if (!hasHighlights || !highlightRanges) return "";
    return highlightsToOverlayHtml(value, [...highlightRanges]);
  }, [hasHighlights, highlightRanges, value]);

  const syncBackdropScroll: UIEventHandler<HTMLTextAreaElement> = (event) => {
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.scrollTop = event.currentTarget.scrollTop;
      backdrop.scrollLeft = event.currentTarget.scrollLeft;
    }
    onScroll?.(event);
  };

  return (
    <div className="grid min-h-[28rem] w-full flex-1">
      {hasHighlights ? (
        <div
          ref={backdropRef}
          aria-hidden
          data-manuscript-highlight-overlay=""
          className={cn(
            "pointer-events-none col-start-1 row-start-1 z-0 min-h-[28rem] w-full overflow-hidden",
            "rounded-ns-lg border border-transparent bg-ns-surface",
            "px-ns-5 py-ns-5 leading-ns-relaxed text-ns-ink",
            "whitespace-pre-wrap break-words font-[inherit]",
            className,
          )}
          style={{ fontSize: "var(--ns-editor-font-size, 1rem)" }}
          dangerouslySetInnerHTML={{ __html: overlayHtml }}
        />
      ) : null}
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
        onScroll={syncBackdropScroll}
        spellCheck
        aria-label={
          documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
        }
        placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
        className={cn(
          "col-start-1 row-start-1 z-10 min-h-[28rem] w-full flex-1 resize-y",
          "rounded-ns-lg border border-ns-border",
          "px-ns-5 py-ns-5 leading-ns-relaxed text-ns-ink",
          "placeholder:text-ns-ink-tertiary",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          "disabled:cursor-not-allowed disabled:bg-ns-muted",
          hasHighlights
            ? "bg-transparent text-transparent selection:bg-ns-accent/25 selection:text-transparent"
            : "bg-ns-surface",
          className,
        )}
        style={{
          fontSize: "var(--ns-editor-font-size, 1rem)",
          ...(hasHighlights
            ? { caretColor: "var(--ns-color-ink)" }
            : null),
        }}
      />
    </div>
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
