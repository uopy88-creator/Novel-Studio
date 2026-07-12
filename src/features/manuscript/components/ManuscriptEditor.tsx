"use client";

/**
 * =============================================================================
 * ManuscriptEditor
 * -----------------------------------------------------------------------------
 * 큰 plain-text 원고 에디터.
 * - 검색 점프를 위해 ref + setSelectionRange 지원
 * - @멘션 자동완성을 위해 키보드/클릭/선택/IME 핸들러 전달 가능
 * - colorSource 가 있으면 색상 오버레이를 표시 (textarea 글자는 투명, 캐럿만 보임)
 * =============================================================================
 */

import {
  forwardRef,
  useCallback,
  useState,
  type CompositionEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactEventHandler,
  type UIEvent,
} from "react";
import {
  MANUSCRIPT_FG_CSS,
  parseManuscriptColorRuns,
} from "@/features/manuscript/lib/manuscript-markup";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  documentTitle?: string;
  disabled?: boolean;
  className?: string;
  /**
   * 저장본(마커 포함). 지정 시 색상 미러 오버레이를 켠다.
   * value 는 마커가 제거된 표시/편집 문자열이어야 한다.
   */
  colorSource?: string;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>;
  onClick?: MouseEventHandler<HTMLTextAreaElement>;
  onSelect?: ReactEventHandler<HTMLTextAreaElement>;
  onCompositionStart?: CompositionEventHandler<HTMLTextAreaElement>;
  onCompositionEnd?: CompositionEventHandler<HTMLTextAreaElement>;
  onMouseUp?: MouseEventHandler<HTMLTextAreaElement>;
  onScroll?: ReactEventHandler<HTMLTextAreaElement>;
}

const EDITOR_SURFACE =
  "min-h-[28rem] w-full flex-1 resize-y rounded-ns-lg border border-ns-border bg-ns-surface";
const EDITOR_PAD =
  "px-ns-5 py-ns-5 leading-ns-relaxed";

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
    colorSource,
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
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const showColorOverlay = typeof colorSource === "string";
  const colorRuns = showColorOverlay
    ? parseManuscriptColorRuns(colorSource)
    : [];

  const handleScroll = useCallback(
    (event: UIEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;
      setScroll({ top: el.scrollTop, left: el.scrollLeft });
      onScroll?.(event);
    },
    [onScroll],
  );

  return (
    <div className="relative min-h-[28rem] w-full flex-1">
      {showColorOverlay ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden",
            "rounded-ns-lg border border-transparent",
            EDITOR_PAD,
            "font-mono whitespace-pre-wrap break-words text-ns-ink",
          )}
          style={{ fontSize: "var(--ns-editor-font-size, 1rem)" }}
        >
          <div
            style={{
              transform: `translate(${-scroll.left}px, ${-scroll.top}px)`,
            }}
          >
            {colorRuns.length === 0 ? (
              <span className="text-transparent">{"\u00a0"}</span>
            ) : (
              colorRuns.map((run, index) => (
                <span
                  key={index}
                  style={{ color: MANUSCRIPT_FG_CSS[run.color] }}
                >
                  {run.text.length > 0 ? run.text : null}
                </span>
              ))
            )}
          </div>
        </div>
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
        onScroll={handleScroll}
        spellCheck
        aria-label={
          documentTitle ? `원고 편집: ${documentTitle}` : "원고 편집"
        }
        placeholder="여기에 원고를 작성하세요… (@로 인물 멘션)"
        className={cn(
          EDITOR_SURFACE,
          EDITOR_PAD,
          "text-ns-ink",
          "placeholder:text-ns-ink-tertiary",
          "transition-[border-color,box-shadow] duration-150",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          "disabled:cursor-not-allowed disabled:bg-ns-muted",
          // 글자만 투명 — 플레이스홀더는 빈 원고에서 보이도록 유지
          showColorOverlay &&
            "relative z-10 bg-transparent text-transparent caret-ns-ink",
          className,
        )}
        style={{ fontSize: "var(--ns-editor-font-size, 1rem)" }}
      />
    </div>
  );
});

ManuscriptEditor.displayName = "ManuscriptEditor";
