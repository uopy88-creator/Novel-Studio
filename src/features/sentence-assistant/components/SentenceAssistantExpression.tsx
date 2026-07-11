"use client";

/**
 * =============================================================================
 * SentenceAssistantExpression
 * -----------------------------------------------------------------------------
 * ✍ 표현 탭 — 유의어 · 관용 표현 Chip 만 제공.
 * 문장 추천·자동 수정·AI 문장·Show/Tell 예시는 다루지 않는다.
 * Chip 클릭 = 클립보드 복사만 (원고 수정 없음).
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyToast } from "@/features/sentence-assistant/components/CopyToast";
import { ExpressionChip } from "@/features/sentence-assistant/components/ExpressionChip";
import { ExpressionService } from "@/features/sentence-assistant/lib/ExpressionService";
import { EXPRESSION_NOT_FOUND_MESSAGE } from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export interface SentenceAssistantExpressionProps {
  selectedText: string;
}

const TOAST_MS = 2000;

export function SentenceAssistantExpression({
  selectedText,
}: SentenceAssistantExpressionProps) {
  const query = normalizeDictionaryQuery(selectedText);
  const result = useMemo(
    () => ExpressionService.lookupExpressions(query),
    [query],
  );

  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timer = window.setTimeout(() => setToastOpen(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastOpen(true);
    } catch (error) {
      console.error("[SentenceAssistantExpression] copy failed", error);
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setToastOpen(true);
      } catch {
        // ignore
      }
    }
  }, []);

  const displayWord = query || selectedText.trim() || "—";
  const hasAny =
    result.synonyms.length > 0 || result.idioms.length > 0;

  return (
    <>
      <div className="flex flex-col gap-ns-5">
        <section>
          <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
            선택
          </h3>
          <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
            “{displayWord}”
          </p>
        </section>

        <div className="border-t border-ns-border" />

        {!hasAny ? (
          <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {EXPRESSION_NOT_FOUND_MESSAGE}
          </p>
        ) : (
          <>
            <section>
              <h3 className="mb-ns-3 text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
                유의어
              </h3>
              {result.synonyms.length === 0 ? (
                <p className="text-ns-sm text-ns-ink-tertiary">없음</p>
              ) : (
                <div className="flex flex-wrap gap-ns-2">
                  {result.synonyms.map((item) => (
                    <ExpressionChip
                      key={item}
                      label={item}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              )}
            </section>

            <div className="border-t border-ns-border" />

            <section>
              <h3 className="mb-ns-3 text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
                관용 표현
              </h3>
              {result.idioms.length === 0 ? (
                <p className="text-ns-sm text-ns-ink-tertiary">없음</p>
              ) : (
                <div className="flex flex-wrap gap-ns-2">
                  {result.idioms.map((item) => (
                    <ExpressionChip
                      key={item}
                      label={item}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <CopyToast open={toastOpen} />
    </>
  );
}
