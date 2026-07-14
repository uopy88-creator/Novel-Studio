"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * textarea 기반 원고 에디터 (contentEditable 아님).
 *
 * Highlight (하이라이트 추가 이후 레이아웃 오류 수정):
 * - 문제였던 방식: textarea 를 투명하게 하고 뒤에 배경/배경을 깔음
 *   → 줄바꿈 불일치·투명 구간이 “빈 공간”처럼 보임
 * - 현재 방식: textarea 는 항상 불투명(본문 SSOT).
 *   하이라이트는 위쪽 반투명 배경 rect + mix-blend-mode 로만 칠함
 *   (pointer-events: none → 선택/입력은 그대로 textarea)
 *
 * spellCheck:
 * - 브라우저·확장 맞춤법 빨간 물결 방지
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

/** #BFE8FF → rgba (글자 위 반투명 하이라이트용) */
function skyHighlightFill(alpha = 0.55): string {
  const hex = SKY_HIGHLIGHT_COLOR.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** plain 좌표 Highlight 구간 */
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

function applyMirrorTypography(
  mirror: HTMLDivElement,
  el: HTMLTextAreaElement,
): void {
  const style = window.getComputedStyle(el);
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
}

/**
 * 한 번의 mirror 레이아웃으로 모든 highlight rect 측정.
 * (range 마다 replaceChildren 하던 방식은 긴 원고에서 버벅임의 원인)
 */
function measureHighlightRects(
  el: HTMLTextAreaElement,
  ranges: readonly HighlightRange[],
): HlRect[] {
  if (ranges.length === 0) return [];

  const mirror = getHighlightMirror();
  applyMirrorTypography(mirror, el);

  const value = el.value;
  const frag = document.createDocumentFragment();
  const marks: {
    el: HTMLSpanElement;
    rangeIndex: number;
    start: number;
    end: number;
  }[] = [];

  let cursor = 0;
  const sorted = [...ranges]
    .map((r, rangeIndex) => ({
      rangeIndex,
      start: Math.max(0, Math.min(r.start, value.length)),
      end: Math.max(0, Math.min(r.end, value.length)),
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  for (const range of sorted) {
    if (range.start < cursor) continue;
    if (range.start > cursor) {
      frag.appendChild(document.createTextNode(value.slice(cursor, range.start)));
    }
    const mark = document.createElement("span");
    mark.setAttribute("data-ns-hl-measure", String(range.rangeIndex));
    mark.textContent = value.slice(range.start, range.end) || "\u200b";
    frag.appendChild(mark);
    marks.push({
      el: mark,
      rangeIndex: range.rangeIndex,
      start: range.start,
      end: range.end,
    });
    cursor = range.end;
  }
  if (cursor < value.length) {
    frag.appendChild(document.createTextNode(value.slice(cursor)));
  } else if (value.length === 0) {
    frag.appendChild(document.createTextNode("\u200b"));
  }

  mirror.replaceChildren(frag);
  mirror.scrollTop = el.scrollTop;
  mirror.scrollLeft = el.scrollLeft;

  // 미러는 화면 밖(top:0, left:-100000)에 있으므로 textarea 원점이 아니라
  // mirror 원점 기준으로 상대 좌표를 구한다.
  // elRect 를 빼면 수백 px 위로 밀려 overflow-hidden 에 잘림 → 하이라이트 안 보임
  const mirrorRect = mirror.getBoundingClientRect();

  const out: HlRect[] = [];
  for (const mark of marks) {
    const clientRects = mark.el.getClientRects();
    for (let i = 0; i < clientRects.length; i += 1) {
      const rect = clientRects[i];
      if (rect.width < 0.5 || rect.height < 0.5) continue;
      out.push({
        key: `${mark.rangeIndex}:${i}:${mark.start}:${mark.end}`,
        top: rect.top - mirrorRect.top,
        left: rect.left - mirrorRect.left,
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
    <div className="relative min-h-[28rem] w-full flex-1">
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
        // 브라우저·확장 맞춤법 빨간 물결 방지
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        aria-label={
          documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
        }
        placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
        className={cn(
          "relative z-0 box-border min-h-[28rem] w-full flex-1 resize-y",
          "rounded-ns-lg border border-ns-border bg-ns-surface",
          "px-ns-5 py-ns-5 leading-ns-relaxed text-ns-ink",
          "whitespace-pre-wrap break-words",
          "placeholder:text-ns-ink-tertiary",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          "disabled:cursor-not-allowed disabled:bg-ns-muted",
          className,
        )}
        style={typographyStyle}
      />

      {/*
        Highlight 는 textarea **위**에 반투명으로만 칠한다.
        textarea 는 항상 불투명 → 투명 배경으로 생기던 “빈 공간” 제거.
        pointer-events-none → 드래그/입력은 textarea 가 받음.
      */}
      {hasHighlights && hlRects.length > 0 ? (
        <div
          aria-hidden
          data-manuscript-highlight-overlay=""
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-ns-lg"
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
                // 불투명 textarea 위에 올려도 글자가 보이도록 반투명
                backgroundColor: skyHighlightFill(0.55),
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
