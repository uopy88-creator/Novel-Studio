"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * 큰 plain-text 원고 에디터.
 * - 검색 점프를 위해 ref + setSelectionRange 지원
 * - @멘션 자동완성을 위해 키보드/클릭/선택/IME 핸들러 전달 가능
 * - 하늘색 Highlight: textarea 글자는 항상 보이고, 뒤에 배경만 오버레이
 *   (투명 글자 방식은 드래그 선택과 보이는 글자가 어긋나 폐기)
 * =============================================================================
 */

import {
  forwardRef,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  type CompositionEventHandler,
  type CSSProperties,
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

/** textarea / overlay 줄바꿈·폭을 맞추는 공통 타이포 */
const EDITOR_SURFACE =
  "min-h-[28rem] w-full rounded-ns-lg border px-ns-5 py-ns-5 leading-ns-relaxed";

/** 양쪽 동일해야 하이라이트 배경이 글자와 어긋나지 않는다 */
const WRAP_SYNC =
  "whitespace-pre-wrap break-words [scrollbar-gutter:stable] overflow-y-scroll";

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
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hasHighlights = Boolean(highlightRanges && highlightRanges.length > 0);

  // 오버레이 HTML 재생성은 입력보다 한 박자 늦게 — 타이핑 응답성 우선
  const deferredValue = useDeferredValue(value);
  const deferredRanges = useDeferredValue(highlightRanges);

  const setTextareaRef = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const overlayHtml = useMemo(() => {
    if (!hasHighlights || !deferredRanges || deferredRanges.length === 0) {
      return "";
    }
    return highlightsToOverlayHtml(deferredValue, [...deferredRanges]);
  }, [deferredRanges, deferredValue, hasHighlights]);

  const syncBackdropScroll = () => {
    const el = localRef.current;
    const backdrop = backdropRef.current;
    if (!el || !backdrop) return;
    backdrop.scrollTop = el.scrollTop;
    backdrop.scrollLeft = el.scrollLeft;
  };

  const onTextareaScroll: UIEventHandler<HTMLTextAreaElement> = (event) => {
    syncBackdropScroll();
    onScroll?.(event);
  };

  // 스크롤바/리사이즈 후에도 오버레이 줄바꿈이 textarea 와 같도록 폭 동기화
  useLayoutEffect(() => {
    if (!hasHighlights) return;
    const el = localRef.current;
    const backdrop = backdropRef.current;
    if (!el || !backdrop) return;

    const syncMetrics = () => {
      backdrop.style.width = `${el.offsetWidth}px`;
      backdrop.style.height = `${el.offsetHeight}px`;
      syncBackdropScroll();
    };

    syncMetrics();
    const ro = new ResizeObserver(syncMetrics);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasHighlights, value, className, overlayHtml]);

  const typographyStyle: CSSProperties = {
    fontSize: "var(--ns-editor-font-size, 1rem)",
    tabSize: 4,
    WebkitTextSizeAdjust: "100%",
  };

  return (
    <div className="relative grid min-h-[28rem] w-full flex-1">
      {hasHighlights ? (
        <div
          ref={backdropRef}
          aria-hidden
          data-manuscript-highlight-overlay=""
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-0 box-border",
            EDITOR_SURFACE,
            WRAP_SYNC,
            "border-transparent bg-ns-surface text-transparent",
            // 글자는 투명, mark 배경만 보이게 — 실제 글/선택은 위 textarea
            "[&_mark[data-ns-hl=sky]]:bg-[#BFE8FF] [&_mark[data-ns-hl=sky]]:text-transparent [&_mark[data-ns-hl=sky]]:rounded-sm",
            className,
          )}
          style={typographyStyle}
          dangerouslySetInnerHTML={{ __html: overlayHtml }}
        />
      ) : null}
      <textarea
        ref={setTextareaRef}
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
        onScroll={onTextareaScroll}
        spellCheck
        aria-label={
          documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
        }
        placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
        className={cn(
          "relative z-10 box-border min-h-[28rem] w-full flex-1 resize-y",
          EDITOR_SURFACE,
          WRAP_SYNC,
          "border-ns-border text-ns-ink",
          "placeholder:text-ns-ink-tertiary",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          "disabled:cursor-not-allowed disabled:bg-ns-muted",
          // Highlight 있을 때도 글자는 그대로 보임 (선택 = 보이는 글)
          hasHighlights
            ? "bg-transparent caret-[var(--ns-color-ink)]"
            : "bg-ns-surface",
          className,
        )}
        style={typographyStyle}
      />
    </div>
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
