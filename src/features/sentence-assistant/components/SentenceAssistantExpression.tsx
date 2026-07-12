"use client";

/**
 * =============================================================================
 * SentenceAssistantExpression — 표현 바꾸기
 * -----------------------------------------------------------------------------
 * 유의어 Chip → 선택 위치의 단어만 교체 (AI 없음).
 * 키보드: ←→↑↓ / Tab / Enter / Esc(패널 닫기는 Panel 이 처리)
 * =============================================================================
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ExpressionChip } from "@/features/sentence-assistant/components/ExpressionChip";
import { ExpressionToast } from "@/features/sentence-assistant/components/ExpressionToast";
import { ExpressionService } from "@/features/sentence-assistant/lib/ExpressionService";
import {
  EXPRESSION_NO_SELECTION_MESSAGE,
  EXPRESSION_NOT_FOUND_MESSAGE,
  EXPRESSION_REPLACED_TOAST_MESSAGE,
} from "@/features/sentence-assistant/lib/expression-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export interface SentenceAssistantExpressionProps {
  selectedText: string;
  /** 유의어 Chip → 원고 선택 구간 교체 */
  onReplaceWith?: (synonym: string) => void;
}

const TOAST_MS = 2000;

export function SentenceAssistantExpression({
  selectedText,
  onReplaceWith,
}: SentenceAssistantExpressionProps) {
  const query = normalizeDictionaryQuery(selectedText);
  const hasSelection = Boolean(query);

  const result = useMemo(
    () => (hasSelection ? ExpressionService.lookupExpressions(query) : null),
    [hasSelection, query],
  );
  const synonyms = useMemo(
    () => result?.synonyms ?? [],
    [result],
  );

  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);

  // 검색어·목록이 바뀌면 포커스 인덱스 리셋
  useEffect(() => {
    setFocusIndex(0);
  }, [query, synonyms.length]);

  useEffect(() => {
    if (!toastOpen) return;
    const timer = window.setTimeout(() => setToastOpen(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  const focusChipAt = useCallback((index: number) => {
    const root = listRef.current;
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>(
      "[data-expression-chip]",
    );
    const btn = buttons[index];
    if (btn && !btn.disabled) {
      btn.focus();
    }
  }, []);

  useEffect(() => {
    if (!hasSelection || synonyms.length === 0) return;
    // 활성 칩으로 포커스 이동 (비활성만 있으면 스킵)
    const firstEnabled = synonyms.findIndex(
      (s) => normalizeDictionaryQuery(s) !== query,
    );
    if (firstEnabled >= 0) {
      setFocusIndex(firstEnabled);
      // 탭 진입 직후 포커스 (레이아웃 후)
      requestAnimationFrame(() => focusChipAt(firstEnabled));
    }
  }, [hasSelection, synonyms, query, focusChipAt]);

  const selectSynonym = useCallback(
    (synonym: string) => {
      if (!hasSelection) return;
      if (normalizeDictionaryQuery(synonym) === query) return;
      onReplaceWith?.(synonym);
      setToastOpen(true);
    },
    [hasSelection, onReplaceWith, query],
  );

  /** 칩 그리드에서 열 수 추정 (↑↓ 이동용) */
  const estimateColumns = useCallback((): number => {
    const root = listRef.current;
    if (!root) return 1;
    const buttons = [
      ...root.querySelectorAll<HTMLButtonElement>("[data-expression-chip]"),
    ];
    if (buttons.length < 2) return 1;
    const top0 = buttons[0].offsetTop;
    let cols = 1;
    for (let i = 1; i < buttons.length; i += 1) {
      if (buttons[i].offsetTop !== top0) break;
      cols += 1;
    }
    return Math.max(1, cols);
  }, []);

  const moveFocus = useCallback(
    (delta: number) => {
      if (synonyms.length === 0) return;
      let next = focusIndex;
      for (let step = 0; step < synonyms.length; step += 1) {
        next = (next + delta + synonyms.length) % synonyms.length;
        // 비활성(현재 단어와 동일) 칩은 건너뜀
        if (normalizeDictionaryQuery(synonyms[next]) !== query) {
          setFocusIndex(next);
          focusChipAt(next);
          return;
        }
      }
    },
    [focusIndex, focusChipAt, query, synonyms],
  );

  const handleListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (synonyms.length === 0) return;

    const cols = estimateColumns();

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus(event.key === "ArrowDown" ? cols : 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus(event.key === "ArrowUp" ? -cols : -1);
        break;
      case "Tab":
        event.preventDefault();
        moveFocus(event.shiftKey ? -1 : 1);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        // click() 으로 짧은 선택 애니메이션과 동일 경로 사용
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
          "[data-expression-chip]",
        );
        buttons?.[focusIndex]?.click();
        break;
      }
      default:
        break;
    }
  };

  if (!hasSelection) {
    return (
      <div className="flex flex-col gap-ns-5">
        <section>
          <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
            표현 바꾸기
          </h3>
          <p className="mt-ns-3 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {EXPRESSION_NO_SELECTION_MESSAGE}
          </p>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-ns-5">
        <section>
          <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
            표현 바꾸기
          </h3>
          <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
            [ {query} ]
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
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="유의어"
              className="flex flex-wrap gap-ns-2"
              onKeyDown={handleListKeyDown}
            >
              {synonyms.map((item, index) => {
                const sameAsCurrent =
                  normalizeDictionaryQuery(item) === query;
                return (
                  <ExpressionChip
                    key={item}
                    label={item}
                    disabled={sameAsCurrent}
                    selected={index === focusIndex}
                    tabIndex={index === focusIndex && !sameAsCurrent ? 0 : -1}
                    onFocus={() => setFocusIndex(index)}
                    onSelect={selectSynonym}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ExpressionToast
        open={toastOpen}
        message={EXPRESSION_REPLACED_TOAST_MESSAGE}
      />
    </>
  );
}
