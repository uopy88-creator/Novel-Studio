"use client";

/**
 * =============================================================================
 * Header
 * -----------------------------------------------------------------------------
 * 작업실 상단 바 — 작품 제목 + 검색(Ctrl+K) 트리거.
 * =============================================================================
 */

import { cn } from "@/lib/utils/cn";

export interface HeaderProps {
  /** 현재 작품 제목 */
  projectTitle: string;
  /** 제목을 아직 LocalStorage에서 읽는 중 */
  titleLoading?: boolean;
  /** 모바일 사이드바 열기 */
  onOpenMobileMenu: () => void;
  /** 프로젝트 전체 검색 열기 */
  onOpenSearch?: () => void;
  className?: string;
}

export function Header({
  projectTitle,
  titleLoading = false,
  onOpenMobileMenu,
  onOpenSearch,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-ns-3 border-b border-ns-border bg-ns-surface px-ns-4 sm:px-ns-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-ns-md",
          "text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink md:hidden",
        )}
        aria-label="메뉴 열기"
      >
        <span aria-hidden="true" className="text-ns-lg leading-none">
          ☰
        </span>
      </button>

      <h1 className="min-w-0 flex-1 truncate text-ns-base font-semibold tracking-tight text-ns-ink sm:text-ns-lg">
        {titleLoading ? (
          <span className="text-ns-ink-tertiary">불러오는 중…</span>
        ) : (
          projectTitle || "제목 없는 작품"
        )}
      </h1>

      {onOpenSearch ? (
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            "inline-flex min-h-9 shrink-0 items-center gap-ns-2 rounded-ns-md border border-ns-border",
            "bg-ns-canvas px-ns-3 text-ns-sm text-ns-ink-secondary",
            "hover:bg-ns-muted hover:text-ns-ink",
          )}
          aria-label="프로젝트 검색 (Ctrl+K)"
        >
          <span aria-hidden>🔍</span>
          <span className="hidden sm:inline">검색</span>
          <kbd className="hidden rounded border border-ns-border px-1 py-px text-ns-xs text-ns-ink-tertiary md:inline">
            Ctrl+K
          </kbd>
        </button>
      ) : null}
    </header>
  );
}
