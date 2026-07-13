"use client";

/**
 * =============================================================================
 * SentenceAssistantShowTell
 * -----------------------------------------------------------------------------
 * Show / Tell 은 작법 이해용 분석 도구다.
 * - 판정(Show | Tell)을 보여 준다.
 * - Tell 일 때만 작법 방향(행동·표정·대사·배경)과 독립 예시를 보여 준다.
 * - Show 일 때는 배지만 표시한다 (추가 메뉴 없음).
 * - 선택 문장을 고치지 않으며, AI가 문장을 대신 쓰지 않는다.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import {
  SHOW_TELL_DISCLAIMER,
  SHOW_TELL_EMPTY_SELECTION,
  SHOW_TELL_JUDGMENT_LABEL,
  SHOW_TELL_STYLES,
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

  /** Tell 전용 — 선택한 작법 방향 */
  const [style, setStyle] = useState<ShowTellStyleId | null>(null);

  // 선택이 바뀌면 작법 방향 초기화
  useEffect(() => {
    setStyle(null);
  }, [selectedText]);

  /**
   * Tell + 스타일 선택 시에만 독립 작법 예시(여러 개)를 가져온다.
   * 선택 문장을 재작성하지 않는다.
   */
  const craftExamples = useMemo(() => {
    if (!analysis || analysis.kind !== "tell" || style == null) return null;
    return sentenceAssistantCore.getShowTellCraftExamples(
      analysis.sentence,
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

  const isTell = analysis.kind === "tell";
  const judgmentLabel = isTell ? "Tell" : "Show";

  return (
    <div className="flex flex-col gap-ns-5">
      {/* 선택 문장 (읽기 전용) */}
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          선택
        </h3>
        <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
          “{analysis.sentence}”
        </p>
      </section>

      <div className="border-t border-ns-border" />

      {/* 1. 판정 — Show 또는 Tell */}
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          {SHOW_TELL_JUDGMENT_LABEL}
        </h3>
        <p className="mt-ns-2">
          <span
            className={cn(
              "inline-flex items-center rounded-ns-md border px-ns-3 py-ns-1",
              "text-ns-sm font-semibold",
              isTell
                ? "border-ns-border bg-ns-muted text-ns-ink"
                : "border-ns-accent/30 bg-ns-accent/10 text-ns-accent",
            )}
          >
            {judgmentLabel}
          </span>
        </p>
      </section>

      {/*
        Tell 전용: 작법 방향 안내.
        Show 판정 시에는 아래 메뉴를 표시하지 않는다.
      */}
      {isTell ? (
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

      {/* 선택한 방향의 독립 작법 예시 (여러 개). 원고에 적용하지 않음. */}
      {craftExamples && craftExamples.examples.length > 0 ? (
        <>
          <div className="border-t border-ns-border" />

          <section>
            <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
              예시
            </h3>
            <ul className="mt-ns-3 flex flex-col gap-ns-3">
              {craftExamples.examples.map((text, index) => (
                <li
                  key={`${craftExamples.style}-${index}`}
                  className="whitespace-pre-wrap break-words text-ns-sm leading-ns-relaxed text-ns-ink"
                >
                  <span className="mr-ns-2 text-ns-ink-tertiary">
                    {index + 1}.
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-ns-4 whitespace-pre-line text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
              {SHOW_TELL_DISCLAIMER}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
