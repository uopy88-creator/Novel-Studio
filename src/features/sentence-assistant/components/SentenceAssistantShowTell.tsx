"use client";

/**
 * =============================================================================
 * SentenceAssistantShowTell
 * -----------------------------------------------------------------------------
 * 👁 Show / Tell 탭 — 분석 + 반대 방식 참고 예시만 제공.
 * 원고 수정·자동 적용·클립보드 복사는 하지 않는다.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import {
  SHOW_TELL_DISCLAIMER,
  SHOW_TELL_EMPTY_SELECTION,
  SHOW_TELL_STYLES,
  type ShowTellKind,
  type ShowTellStyleId,
} from "@/features/sentence-assistant/engines/show-tell/show-tell-types";
import { useShowTellAnalysis } from "@/features/sentence-assistant/hooks/useShowTellAnalysis";
import { cn } from "@/lib/utils/cn";

export interface SentenceAssistantShowTellProps {
  selectedText: string;
}

export function SentenceAssistantShowTell({
  selectedText,
}: SentenceAssistantShowTellProps) {
  const analysis = useShowTellAnalysis(selectedText);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [style, setStyle] = useState<ShowTellStyleId | null>(null);

  // 선택이 바뀌면 펼침·선택 초기화
  useEffect(() => {
    setPickerOpen(false);
    setStyle(null);
  }, [selectedText]);

  const example = useMemo(() => {
    if (!analysis || style == null) return null;
    const targetKind: ShowTellKind =
      analysis.kind === "tell" ? "show" : "tell";
    return sentenceAssistantCore.getShowTellExample(
      analysis.sentence,
      targetKind,
      style,
    );
  }, [analysis, style]);

  if (!analysis) {
    return (
      <div className="flex flex-col gap-ns-5">
        <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
          {SHOW_TELL_EMPTY_SELECTION}
        </p>
      </div>
    );
  }

  const buttonLabel =
    analysis.kind === "tell"
      ? "Show 방식 예시 보기"
      : "Tell 방식 예시 보기";


  return (
    <div className="flex flex-col gap-ns-5">
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          선택
        </h3>
        <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
          “{analysis.sentence}”
        </p>
      </section>

      <div className="border-t border-ns-border" />

      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          현재 분석
        </h3>
        <p className="mt-ns-2 text-ns-lg font-semibold text-ns-ink">
          {analysis.kind === "tell" ? "Tell" : "Show"}
        </p>
      </section>

      <div>
        <button
          type="button"
          onClick={() => {
            setPickerOpen((open) => {
              if (open) setStyle(null);
              return !open;
            });
          }}
          className={cn(
            "inline-flex min-h-9 items-center rounded-ns-md border border-ns-border",
            "bg-ns-surface px-ns-4 text-ns-sm font-medium text-ns-ink",
            "hover:border-ns-border-strong hover:bg-ns-muted",
            "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
          )}
        >
          {buttonLabel}
        </button>
      </div>

      {pickerOpen ? (
        <>
          <div className="border-t border-ns-border" />

          <section>
            <h3 className="mb-ns-3 text-ns-sm font-medium text-ns-ink">
              어떤 방식으로 바꿔볼까요?
            </h3>
            <ul className="flex flex-col gap-ns-2" role="radiogroup">
              {SHOW_TELL_STYLES.map((option) => {
                const checked = style === option.id;
                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-ns-3 rounded-ns-md px-ns-2 py-ns-2",
                        "hover:bg-ns-muted",
                        checked && "bg-ns-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="show-tell-style"
                        value={option.id}
                        checked={checked}
                        onChange={() => setStyle(option.id)}
                        className="h-4 w-4 accent-[var(--ns-accent)]"
                      />
                      <span className="text-ns-sm text-ns-ink">
                        {option.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}

      {example ? (
        <>
          <div className="border-t border-ns-border" />

          <section>
            <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
              예시
            </h3>
            <p className="mt-ns-3 whitespace-pre-wrap break-words text-ns-sm leading-ns-relaxed text-ns-ink">
              {example.example}
            </p>
            <p className="mt-ns-4 whitespace-pre-line text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
              {SHOW_TELL_DISCLAIMER}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
