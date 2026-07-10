"use client";

/**
 * =============================================================================
 * SearchBar
 * -----------------------------------------------------------------------------
 * 현재 원고(content) 안에서 단어·문장을 검색한다.
 * 결과 목록을 클릭하면 onJump(start, end)로 에디터 위치를 이동한다.
 * =============================================================================
 */

import { useMemo, useState } from "react";
import {
  findManuscriptMatches,
  type ManuscriptSearchMatch,
} from "@/features/manuscript/lib/search-manuscript";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface SearchBarProps {
  content: string;
  /** 검색 결과 클릭 시 본문 오프셋으로 이동 */
  onJump: (start: number, end: number) => void;
  className?: string;
}

export function SearchBar({ content, onJump, className }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(
    () => findManuscriptMatches(content, query),
    [content, query],
  );

  return (
    <div className={cn("flex flex-col gap-ns-3", className)}>
      <Input
        label="원고 검색"
        name="manuscript-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="단어나 문장을 검색하세요"
        hint={
          query.trim()
            ? `${matches.length}건 찾음`
            : "대소문자를 구분하지 않습니다"
        }
      />

      {query.trim() ? (
        <ul
          className="max-h-48 overflow-y-auto rounded-ns-md border border-ns-border bg-ns-surface"
          aria-label="검색 결과"
        >
          {matches.length === 0 ? (
            <li className="px-ns-4 py-ns-3 text-ns-sm text-ns-ink-tertiary">
              검색 결과가 없습니다
            </li>
          ) : (
            matches.map((match) => (
              <li key={`${match.start}-${match.end}`}>
                <SearchResultButton match={match} onJump={onJump} />
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function SearchResultButton({
  match,
  onJump,
}: {
  match: ManuscriptSearchMatch;
  onJump: (start: number, end: number) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col gap-ns-1 border-b border-ns-border px-ns-4 py-ns-3 text-left last:border-b-0",
        "hover:bg-ns-muted focus-visible:bg-ns-accent-soft",
      )}
      onClick={() => onJump(match.start, match.end)}
    >
      <span className="text-ns-xs font-medium text-ns-accent">
        #{match.index}
      </span>
      <span className="line-clamp-2 text-ns-sm text-ns-ink-secondary">
        {match.preview}
      </span>
    </button>
  );
}
