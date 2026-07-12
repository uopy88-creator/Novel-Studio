"use client";

/**
 * =============================================================================
 * SentenceAssistantExpression — 표현 바꾸기
 * -----------------------------------------------------------------------------
 * 유의어 Chip 을 보여 주고, 클릭 시 원고의 선택 단어를 교체한다.
 * 문장 생성·관용 표현·AI 추천은 다루지 않는다.
 * =============================================================================
 */

import { useMemo } from "react";
import { ExpressionChip } from "@/features/sentence-assistant/components/ExpressionChip";
import { ExpressionService } from "@/features/sentence-assistant/lib/ExpressionService";
import { EXPRESSION_NOT_FOUND_MESSAGE } from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export interface SentenceAssistantExpressionProps {
  selectedText: string;
  /** 유의어 Chip 클릭 → 원고 선택 구간을 교체 */
  onReplaceWith?: (synonym: string) => void;
}

export function SentenceAssistantExpression({
  selectedText,
  onReplaceWith,
}: SentenceAssistantExpressionProps) {
  const query = normalizeDictionaryQuery(selectedText);
  // JSON 인덱스는 동기·O(1) — query 변경 시에만 재조회
  const result = useMemo(
    () => ExpressionService.lookupExpressions(query),
    [query],
  );

  const displayWord = query || selectedText.trim() || "—";
  const synonyms = result.synonyms;

  return (
    <div className="flex flex-col gap-ns-5">
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          표현 바꾸기
        </h3>
        <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
          [ {displayWord} ]
        </p>
      </section>

      <div className="border-t border-ns-border" />

      <section>
        <h3 className="mb-ns-3 text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          유의어
        </h3>
        {synonyms.length === 0 ? (
          <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {EXPRESSION_NOT_FOUND_MESSAGE}
          </p>
        ) : (
          <div className="flex flex-wrap gap-ns-2">
            {synonyms.map((item) => (
              <ExpressionChip
                key={item}
                label={item}
                onSelect={(synonym) => onReplaceWith?.(synonym)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
