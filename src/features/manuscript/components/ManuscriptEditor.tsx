"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * textarea 기반 원고 에디터 (contentEditable 아님).
 *
 * Highlight:
 * - 예전: 전체 본문 HTML 오버레이 → 줄바꿈 불일치로 본문 사이 “빈 공간”처럼 보임
 * - 현재: textarea 글자는 그대로 두고, 하이라이트 구간만 배경 rect 로 칠함
 *
 * spellCheck:
 * - 한국어 원고에서 빨간 물결 밑줄이 난무하므로 끈다
 * =============================================================================
 */

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CompositionEventHandler,
  type CSSProperties,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactEventHandler,
  type UIEventHandler,
} from "react";
import {
  SKY_HIGHLIGHT_COLOR,
  type HighlightRange,
} from "@/features/manuscript/lib/highlight-marks";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** plain 좌표 Highlight 구간 — 있으면 하늘색 배경만 표시 */
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

interface HlRect {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/** 하이라이트 배경 측정용 미러 — Selection Menu 미러와 분리, 화면 밖 */
let hlMirror: HTMLDivElement | null = null;

function getHighlightMirror(): HTMLDivElement {
  if (hlMirror && hlMirror.isConnected) return hlMirror;
  const mirror = document.createElement("div");
  mirror.setAttribute("data-ns-hl-mirror", "1");
  mirror.setAttribute("aria-hidden", "true");
  mirror.style.cssText =
    "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;z-index:-1;";
  document.body.appendChild(mirror);
  hlMirror = mirror;
  return mirror;
}

/**
 * textarea **보이는 영역** 기준 highlight 배경 rect.
 * (absolute overlay 가 textarea 와 같은 viewport 박스를 덮을 때 사용)
 */
function measureHighlightRects(
  el: HTMLTextAreaElement,
  ranges: readonly HighlightRange[],
): HlRect[] {
  if (ranges.length === 0) return [];

  const style = window.getComputedStyle(el);
  const elRect = el.getBoundingClientRect();
  const mirror = getHighlightMirror();

  mirror.style.width = `${el.clientWidth}px`;
  mirror.style.height = `${el.clientHeight}px`;
  mirror.style.overflow = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflowWrap = "break-word";
  mirror.style.boxSizing = style.boxSizing;
  mirror.style.padding = `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`;
  mirror.style.borderWidth = `${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`;
  mirror.style.borderStyle = style.borderTopStyle;
  mirror.style.font = style.font;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.style.textAlign = style.textAlign;
  mirror.style.textIndent = style.textIndent;
  mirror.style.textTransform = style.textTransform;
  mirror.style.direction = style.direction;
  mirror.style.tabSize = style.tabSize;

  const value = el.value;
  const out: HlRect[] = [];

  for (let r = 0; r < ranges.length; r += 1) {
    const start = Math.max(0, Math.min(ranges[r].start, value.length));
    const end = Math.max(start, Math.min(ranges[r].end, value.length));
    if (end <= start) continue;

    mirror.replaceChildren();
    const mark = document.createElement("span");
    mark.textContent = value.slice(start, end) || "\u200b";
    mirror.appendChild(document.createTextNode(value.slice(0, start)));
    mirror.appendChild(mark);
    mirror.appendChild(
      document.createTextNode(value.slice(end).length > 0 ? value.slice(end) : "."),
    );
    mirror.scrollTop = el.scrollTop;
    mirror.scrollLeft = el.scrollLeft;

    const clientRects = mark.getClientRects();
    for (let i = 0; i < clientRects.length; i += 1) {
      const rect = clientRects[i];
      if (rect.width < 0.5 || rect.height < 0.5) continue;
      // 보이는 textarea 박스 기준 (스크롤 반영된 client rect)
      out.push({
        key: `${r}:${i}:${start}:${end}`,
        top: rect.top - elRect.top,
        left: rect.left - elRect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  return out;
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
  const [localEl, setLocalEl] = useState<HTMLTextAreaElement | null>(null);
  const [hlRects, setHlRects] = useState<HlRect[]>([]);
  const rafRef = useRef(0);
  const hasHighlights = Boolean(highlightRanges && highlightRanges.length > 0);

  const setTextareaRef = (node: HTMLTextAreaElement | null) => {
    setLocalEl(node);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const refreshHighlightRects = useCallback(() => {
    if (!localEl || !hasHighlights || !highlightRanges) {
      setHlRects((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    setHlRects(measureHighlightRects(localEl, highlightRanges));
  }, [hasHighlights, highlightRanges, localEl]);

  const scheduleRefresh = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      refreshHighlightRects();
    });
  }, [refreshHighlightRects]);

  useLayoutEffect(() => {
    refreshHighlightRects();
  }, [refreshHighlightRects, value]);

  useLayoutEffect(() => {
    if (!localEl) return;
    const ro = new ResizeObserver(() => scheduleRefresh());
    ro.observe(localEl);
    return () => {
      ro.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [localEl, scheduleRefresh]);

  const onTextareaScroll: UIEventHandler<HTMLTextAreaElement> = (event) => {
    scheduleRefresh();
    onScroll?.(event);
  };

  const typographyStyle: CSSProperties = {
    fontSize: "var(--ns-editor-font-size, 1rem)",
    tabSize: 4,
    WebkitTextSizeAdjust: "100%",
  };

  return (
    <div className="relative min-h-[28rem] w-full flex-1 rounded-ns-lg bg-ns-surface">
      {/* Highlight 배경만 — 본문 텍스트 복제 없음 */}
      {hasHighlights && hlRects.length > 0 ? (
        <div
          aria-hidden
          data-manuscript-highlight-overlay=""
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-ns-lg"
        >
          {hlRects.map((rect) => (
            <div
              key={rect.key}
              className="absolute rounded-sm"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: SKY_HIGHLIGHT_COLOR,
              }}
            />
          ))}
        </div>
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
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={
          documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
        }
        placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
        className={cn(
          "relative z-10 box-border min-h-[28rem] w-full flex-1 resize-y",
          "rounded-ns-lg border border-ns-border",
          "px-ns-5 py-ns-5 leading-ns-relaxed text-ns-ink",
          "whitespace-pre-wrap break-words",
          "placeholder:text-ns-ink-tertiary",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          "disabled:cursor-not-allowed disabled:bg-ns-muted",
          // 하이라이트 배경이 글자 뒤로 비치도록 투명 (부모 bg-ns-surface 유지)
          hasHighlights ? "bg-transparent caret-[var(--ns-color-ink)]" : "bg-ns-surface",
          className,
        )}
        style={typographyStyle}
      />
    </div>
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
