"use client";

/**
 * =============================================================================
 * Sidebar
 * -----------------------------------------------------------------------------
 * 작품 작업실 좌측 내비게이션.
 *
 * 디자인
 * - Notion / Linear 느낌의 연회색 배경, 얇은 보더
 * - 활성 메뉴만 파란 soft 배경
 * - 접으면 아이콘(이모지)만 보여 PC·iPad 공간을 확보
 *
 * 반응형
 * - md 이상: 고정 사이드바 (접기/펼치기)
 * - md 미만: 오버레이 드로어 (열림 시 배경 딤)
 * =============================================================================
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDIO_NAV_ITEMS, studioPath } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils/cn";

export interface SidebarProps {
  projectId: string;
  /** PC/iPad: 아이콘 레일 모드 */
  collapsed: boolean;
  /** 모바일: 드로어 열림 */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  projectId,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 모바일 오버레이 — 사이드바 밖을 탭하면 닫힘 */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        className={cn(
          "fixed inset-0 z-40 bg-ns-overlay transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          // 공통
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ns-border bg-ns-muted",
          "transition-[width,transform] duration-200 ease-out",
          // 모바일: 슬라이드 인/아웃
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // md+: 항상 보이고, 너비만 접기
          "md:static md:z-0 md:translate-x-0",
          collapsed ? "w-[4.5rem] md:w-[4.5rem]" : "w-64 md:w-60",
        )}
        aria-label="작업실 메뉴"
      >
        {/* 상단: 브랜드 + 접기 버튼 */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-ns-border px-ns-3",
            collapsed ? "justify-center" : "justify-between gap-ns-2",
          )}
        >
          {!collapsed ? (
            <Link
              href="/"
              className="truncate rounded-ns-md px-ns-2 py-ns-1 text-ns-sm font-semibold text-ns-ink hover:bg-ns-surface"
              onClick={onCloseMobile}
            >
              Novel Studio
            </Link>
          ) : (
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-ns-md text-ns-sm font-semibold text-ns-ink hover:bg-ns-surface"
              aria-label="작품 목록으로"
              title="작품 목록"
              onClick={onCloseMobile}
            >
              N
            </Link>
          )}

          {/* 접기/펼치기 — md 이상에서만 (모바일은 오버레이로 닫음) */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "hidden h-9 w-9 shrink-0 items-center justify-center rounded-ns-md",
              "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink md:inline-flex",
            )}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            title={collapsed ? "펼치기" : "접기"}
          >
            <span aria-hidden="true" className="text-ns-base leading-none">
              {collapsed ? "»" : "«"}
            </span>
          </button>
        </div>

        {/* 메뉴 목록 */}
        <nav className="flex-1 overflow-y-auto px-ns-2 py-ns-3">
          <ul className="flex flex-col gap-ns-1">
            {STUDIO_NAV_ITEMS.map((item) => {
              const href = studioPath(projectId, item.segment);
              const active =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li key={item.segment}>
                  <Link
                    href={href}
                    title={item.label}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex min-h-11 items-center rounded-ns-md text-ns-sm font-medium transition-colors",
                      collapsed ? "justify-center px-ns-2" : "gap-ns-3 px-ns-3",
                      active
                        ? "bg-ns-accent-soft text-ns-accent"
                        : "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      {item.icon}
                    </span>
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 하단: 작품 목록으로 돌아가기 */}
        <div className="border-t border-ns-border p-ns-2">
          <Link
            href="/"
            onClick={onCloseMobile}
            title="작품 목록"
            className={cn(
              "flex min-h-11 items-center rounded-ns-md text-ns-sm text-ns-ink-secondary",
              "hover:bg-ns-surface hover:text-ns-ink",
              collapsed ? "justify-center px-ns-2" : "gap-ns-3 px-ns-3",
            )}
          >
            <span aria-hidden="true">←</span>
            {!collapsed ? <span>작품 목록</span> : <span className="sr-only">작품 목록</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
