"use client";

/**
 * =============================================================================
 * Header
 * -----------------------------------------------------------------------------
 * 작업실 상단 바.
 *
 * 요구사항
 * - 현재 작품 제목만 표시
 * - 화려하지 않게, 여백 있는 Notion/Linear 스타일
 *
 * 모바일/iPad 좁은 폭에서는 메뉴 버튼으로 사이드바를 연다.
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
  className?: string;
}

export function Header({
  projectTitle,
  titleLoading = false,
  onOpenMobileMenu,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-ns-3 border-b border-ns-border bg-ns-surface px-ns-4 sm:px-ns-6",
        className,
      )}
    >
      {/* md 미만: 햄버거 — 사이드바가 오버레이로 열림 */}
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

      {/* 작품 제목만 — 다른 액션/배지는 넣지 않는다 */}
      <h1 className="min-w-0 truncate text-ns-base font-semibold tracking-tight text-ns-ink sm:text-ns-lg">
        {titleLoading ? (
          <span className="text-ns-ink-tertiary">불러오는 중…</span>
        ) : (
          projectTitle || "제목 없는 작품"
        )}
      </h1>
    </header>
  );
}
