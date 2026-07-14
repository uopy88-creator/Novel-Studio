"use client";

/**
 * =============================================================================
 * SearchBar — 원고 검색
 * -----------------------------------------------------------------------------
 * - 단어 / 문장 모드
 * - 결과 개수 + 이전/다음
 * - 현재 결과는 목록·에디터(selection)에 하이라이트
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  findManuscriptMatches,
  type ManuscriptSearchMode,
} from "@/features/manuscript/lib/search-manuscript";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface SearchBarProps {
  content: string;
  /** 검색 결과로 이동 — 에디터 selection 하이라이트 */
  onJump: (
    start: number,
    end: number,
    options?: { focus?: boolean },
  ) => void;
  className?: string;
}

export function SearchBar({ content, onJump, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<ManuscriptSearchMode>("word");
  /** 0-based active index; -1 = none */
  const [activeIndex, setActiveIndex] = useState(-1);

  // 입력 중 매 키스트로크 스캔/점프를 피한다
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const matches = useMemo(
    () => findManuscriptMatches(content, debouncedQuery, mode),
    [content, debouncedQuery, mode],
  );

  // 쿼리·모드 변경 시 첫 결과로 이동 (포커스는 유지 — 입력 끊김 방지)
  useEffect(() => {
    if (!debouncedQuery.trim() || matches.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(0);
    const first = matches[0];
    onJump(first.start, first.end, { focus: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- query/mode 변경 시에만
  }, [debouncedQuery, mode]);

  useEffect(() => {
    if (matches.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((i) => (i < 0 ? 0 : Math.min(i, matches.length - 1)));
  }, [matches.length]);

  const jumpToIndex = useCallback(
    (index: number, focus = true) => {
      if (index < 0 || index >= matches.length) return;
      setActiveIndex(index);
      const match = matches[index];
      onJump(match.start, match.end, { focus });
    },
    [matches, onJump],
  );

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const next =
      activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
    jumpToIndex(next);
  }, [activeIndex, jumpToIndex, matches.length]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next =
      activeIndex < 0 || activeIndex >= matches.length - 1
        ? 0
        : activeIndex + 1;
    jumpToIndex(next);
  }, [activeIndex, jumpToIndex, matches.length]);

  const hasQuery = Boolean(query.trim());
  const positionLabel = hasQuery
    ? matches.length === 0
      ? "0 / 0"
      : `${Math.max(activeIndex, 0) + 1} / ${matches.length}`
    : null;

  return (
    <div className={cn("flex flex-col gap-ns-3", className)}>
      <div className="flex flex-col gap-ns-2 sm:flex-row sm:items-end sm:gap-ns-3">
        <div className="min-w-0 flex-1">
          <Input
            label="원고 검색"
            name="manuscript-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault();
                goPrev();
              } else if (event.key === "Enter") {
                event.preventDefault();
                goNext();
              }
            }}
            placeholder={
              mode === "word"
                ? "단어를 검색하세요"
                : "문장·구문을 검색하세요"
            }
            hint={
              hasQuery
                ? `${matches.length}건 · Enter 다음 · Shift+Enter 이전`
                : "대소문자를 구분하지 않습니다"
            }
          />
        </div>

        {/* 단어 / 문장 모드 */}
        <div
          className="flex shrink-0 rounded-ns-md border border-ns-border p-0.5"
          role="group"
          aria-label="검색 모드"
        >
          <ModeButton
            active={mode === "word"}
            onClick={() => setMode("word")}
            label="단어"
          />
          <ModeButton
            active={mode === "sentence"}
            onClick={() => setMode("sentence")}
            label="문장"
          />
        </div>
      </div>

      {hasQuery ? (
        <div className="flex items-center gap-ns-2">
          <span
            className="min-w-[4.5rem] text-ns-sm tabular-nums text-ns-ink-secondary"
            aria-live="polite"
          >
            {positionLabel}
          </span>
          <button
            type="button"
            className={navBtnClass}
            onClick={goPrev}
            disabled={matches.length === 0}
            aria-label="이전 검색 결과"
          >
            ↑ 이전
          </button>
          <button
            type="button"
            className={navBtnClass}
            onClick={goNext}
            disabled={matches.length === 0}
            aria-label="다음 검색 결과"
          >
            ↓ 다음
          </button>
        </div>
      ) : null}

      {hasQuery ? (
        <ul
          className="max-h-48 overflow-y-auto rounded-ns-md border border-ns-border bg-ns-surface"
          aria-label="검색 결과"
        >
          {matches.length === 0 ? (
            <li className="px-ns-4 py-ns-3 text-ns-sm text-ns-ink-tertiary">
              검색 결과가 없습니다
            </li>
          ) : (
            matches.map((match, index) => (
              <li key={`${match.start}-${match.end}-${index}`}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-ns-1 border-b border-ns-border px-ns-4 py-ns-3 text-left last:border-b-0",
                    "hover:bg-ns-muted focus-visible:bg-ns-accent-soft",
                    index === activeIndex && "bg-ns-accent-soft",
                  )}
                  onClick={() => jumpToIndex(index)}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <span className="text-ns-xs font-medium text-ns-accent">
                    #{match.index}
                  </span>
                  <span className="line-clamp-2 text-ns-sm text-ns-ink-secondary">
                    {match.preview}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

const navBtnClass = cn(
  "min-h-9 rounded-ns-md border border-ns-border bg-ns-surface px-ns-3",
  "text-ns-xs font-medium text-ns-ink-secondary",
  "hover:bg-ns-muted hover:text-ns-ink",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-ns-sm px-ns-3 text-ns-xs font-medium transition-colors",
        active
          ? "bg-ns-muted text-ns-ink"
          : "text-ns-ink-tertiary hover:text-ns-ink",
      )}
    >
      {label}
    </button>
  );
}
