"use client";

/**
 * =============================================================================
 * SearchModal (Command Palette)
 * -----------------------------------------------------------------------------
 * Notion 스타일 전역 검색 모달.
 * - Ctrl+K / ⌘K 로 열림 (AppLayout에서 제어)
 * - 실시간 검색 · 종류별 그룹 · 최근 검색어
 * =============================================================================
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { ProjectId } from "@/types/ids";
import type { RecentSearchEntry } from "@/features/global-search/types/search";
import { flattenSearchGroups } from "@/features/global-search/lib/search-service";
import {
  pushRecentSearch,
  readRecentSearches,
  removeRecentSearch,
} from "@/features/global-search/lib/recent-searches";
import { useProjectSearch } from "@/features/global-search/hooks/useProjectSearch";
import { SearchResultItem } from "@/features/global-search/components/SearchResultItem";
import { cn } from "@/lib/utils/cn";

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  projectId: ProjectId;
  /** 결과 행에 표시할 작품명 */
  projectName?: string;
}

export function SearchModal({
  open,
  onClose,
  projectId,
  projectName = "",
}: SearchModalProps) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentSearchEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const { groups, isSearching, error } = useProjectSearch(
    projectId,
    query,
    projectName,
  );
  const flat = useMemo(() => flattenSearchGroups(groups), [groups]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setRecent(readRecentSearches(projectId));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(t);
    };
  }, [open, projectId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, groups]);

  const navigateTo = useCallback(
    (href: string, saveQuery?: string) => {
      const q = (saveQuery ?? query).trim();
      if (q) {
        setRecent(pushRecentSearch(projectId, q));
      }
      onClose();
      router.push(href);
    },
    [onClose, projectId, query, router],
  );

  const selectActive = useCallback(() => {
    const item = flat[activeIndex];
    if (!item) return;
    navigateTo(item.href);
  }, [activeIndex, flat, navigateTo]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (flat.length === 0) return;
      setActiveIndex((i) => (i + 1) % flat.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length === 0) return;
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectActive();
    }
  };

  useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  const showRecent = query.trim().length === 0;
  const totalCount = flat.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-ns-4 pt-[12vh] sm:pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-ns-overlay"
        aria-label="검색 닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-w-xl flex-col overflow-hidden",
          "rounded-ns-xl border border-ns-border bg-ns-surface shadow-ns-lg",
        )}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className="sr-only">
          프로젝트 검색
        </h2>

        <div className="flex items-center gap-ns-2 border-b border-ns-border px-ns-4">
          <span aria-hidden className="text-ns-ink-tertiary">
            🔍
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="프로젝트 전체 검색…"
            className={cn(
              "min-h-12 w-full bg-transparent py-ns-3 text-ns-base text-ns-ink",
              "outline-none placeholder:text-ns-ink-tertiary",
            )}
            aria-autocomplete="list"
            aria-controls="global-search-results"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded-ns-md border border-ns-border px-1.5 py-0.5 text-ns-xs text-ns-ink-tertiary sm:inline">
            esc
          </kbd>
        </div>

        <div
          id="global-search-results"
          ref={listRef}
          className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain py-ns-2"
          role="listbox"
        >
          {showRecent ? (
            <RecentList
              recent={recent}
              onPick={(q) => setQuery(q)}
              onRemove={(q) =>
                setRecent(removeRecentSearch(projectId, q))
              }
            />
          ) : null}

          {!showRecent && isSearching ? (
            <p className="px-ns-4 py-ns-6 text-center text-ns-sm text-ns-ink-tertiary">
              검색 중…
            </p>
          ) : null}

          {!showRecent && error ? (
            <p className="px-ns-4 py-ns-6 text-center text-ns-sm text-ns-danger">
              {error}
            </p>
          ) : null}

          {!showRecent && !isSearching && !error && totalCount === 0 ? (
            <p className="px-ns-4 py-ns-6 text-center text-ns-sm text-ns-ink-tertiary">
              검색 결과가 없습니다.
            </p>
          ) : null}

          {!showRecent && !error
            ? (() => {
                let running = 0;
                return groups.map((group) => (
                  <section key={group.kind} className="mb-ns-2">
                    <header className="sticky top-0 z-[1] flex items-center gap-ns-2 bg-ns-surface/95 px-ns-4 py-ns-1.5 backdrop-blur-sm">
                      <span aria-hidden>{group.icon}</span>
                      <span className="text-ns-xs font-medium text-ns-ink-secondary">
                        {group.label}
                      </span>
                      <span className="text-ns-xs text-ns-ink-tertiary">
                        ({group.items.length})
                      </span>
                    </header>
                    <ul className="px-ns-2">
                      {group.items.map((item) => {
                        const index = running;
                        running += 1;
                        return (
                          <li key={item.id}>
                            <SearchResultItem
                              item={item}
                              query={query}
                              active={index === activeIndex}
                              index={index}
                              onHover={() => setActiveIndex(index)}
                              onSelect={() => navigateTo(item.href)}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ));
              })()
            : null}
        </div>

        <footer className="flex items-center justify-between gap-ns-2 border-t border-ns-border px-ns-4 py-ns-2 text-ns-xs text-ns-ink-tertiary">
          <span>↑↓ 이동 · Enter 열기</span>
          <span className="hidden sm:inline">Ctrl+K / ⌘K</span>
        </footer>
      </div>
    </div>
  );
}

function RecentList({
  recent,
  onPick,
  onRemove,
}: {
  recent: RecentSearchEntry[];
  onPick: (query: string) => void;
  onRemove: (query: string) => void;
}) {
  if (recent.length === 0) {
    return (
      <p className="px-ns-4 py-ns-6 text-center text-ns-sm text-ns-ink-tertiary">
        작품 전체를 검색합니다. Manuscript · Section · Character · Writing Vault ·
        Memo · Foreshadowing
      </p>
    );
  }

  return (
    <section>
      <header className="px-ns-4 py-ns-1.5 text-ns-xs font-medium text-ns-ink-secondary">
        최근 검색어
      </header>
      <ul className="px-ns-2 pb-ns-2">
        {recent.map((entry) => (
          <li
            key={entry.query}
            className="flex items-center gap-ns-1 rounded-ns-md hover:bg-ns-muted/70"
          >
            <button
              type="button"
              className="min-w-0 flex-1 truncate px-ns-3 py-ns-2 text-left text-ns-sm text-ns-ink"
              onClick={() => onPick(entry.query)}
            >
              {entry.query}
            </button>
            <button
              type="button"
              className="mr-ns-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-ns-md text-ns-ink-tertiary hover:bg-ns-muted hover:text-ns-ink"
              aria-label={`“${entry.query}” 삭제`}
              onClick={() => onRemove(entry.query)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
