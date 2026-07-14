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
 * - md 이상: 고정 사이드바 (접기/펼치기), 뷰포트 높이로 잠가 하단 메뉴가 잘리지 않게 함
 * - md 미만: 오버레이 드로어 (열림 시 배경 딤)
 * =============================================================================
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  STUDIO_MAIN_NAV_ITEMS,
  STUDIO_UTILITY_NAV_ITEMS,
  studioPath,
  type StudioNavItem,
} from "@/components/layout/nav-items";
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

function NavLink({
  item,
  projectId,
  pathname,
  collapsed,
  onCloseMobile,
}: {
  item: StudioNavItem;
  projectId: string;
  pathname: string;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const href = studioPath(projectId, item.segment);
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <li>
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
          // 공통 — 뷰포트 높이로 잠가 nav 가 내부 스크롤되게 한다 (PC에서 휴지통이 잘리던 원인)
          "fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh flex-col border-r border-ns-border bg-ns-muted",
          "transition-[width,transform] duration-200 ease-out",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          // 모바일: 슬라이드 인/아웃
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // md+: 레이아웃 흐름에 두고 항상 보이게
          "md:sticky md:top-0 md:z-0 md:translate-x-0",
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

        {/* 주요 메뉴 — 넘치면 이 영역만 스크롤 */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-ns-2 py-ns-3">
          <ul className="flex flex-col gap-ns-1">
            {STUDIO_MAIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.segment}
                item={item}
                projectId={projectId}
                pathname={pathname}
                collapsed={collapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}
          </ul>
        </nav>

        {/* 하단 유틸: 휴지통 · Settings · Help · 작품 목록 — 항상 노출 */}
        <div className="shrink-0 border-t border-ns-border p-ns-2">
          <ul className="flex flex-col gap-ns-1">
            {STUDIO_UTILITY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.segment}
                item={item}
                projectId={projectId}
                pathname={pathname}
                collapsed={collapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}
          </ul>
          <Link
            href={studioPath(projectId, "help")}
            onClick={onCloseMobile}
            title="Help"
            className={cn(
              "mt-ns-1 flex min-h-11 items-center rounded-ns-md text-ns-sm font-medium transition-colors",
              collapsed ? "justify-center px-ns-2" : "gap-ns-3 px-ns-3",
              pathname === studioPath(projectId, "help") ||
                pathname.startsWith(`${studioPath(projectId, "help")}/`)
                ? "bg-ns-accent-soft text-ns-accent"
                : "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink",
            )}
            aria-current={pathname.includes("/help") ? "page" : undefined}
          >
            <span aria-hidden="true">❓</span>
            {!collapsed ? (
              <span className="truncate">Help</span>
            ) : (
              <span className="sr-only">Help</span>
            )}
          </Link>
          <Link
            href="/"
            onClick={onCloseMobile}
            title="작품 목록"
            className={cn(
              "mt-ns-1 flex min-h-11 items-center rounded-ns-md text-ns-sm text-ns-ink-secondary",
              "hover:bg-ns-surface hover:text-ns-ink",
              collapsed ? "justify-center px-ns-2" : "gap-ns-3 px-ns-3",
            )}
          >
            <span aria-hidden="true">←</span>
            {!collapsed ? (
              <span>작품 목록</span>
            ) : (
              <span className="sr-only">작품 목록</span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
