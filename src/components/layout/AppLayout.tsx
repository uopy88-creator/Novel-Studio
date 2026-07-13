"use client";

/**
 * =============================================================================
 * AppLayout
 * -----------------------------------------------------------------------------
 * 작품 작업실의 공통 뼈대.
 *
 * 구성
 * ┌──────────┬─────────────────────┐
 * │ Sidebar  │ Header (작품 제목)   │
 * │          ├─────────────────────┤
 * │          │ ContentContainer    │
 * │          │   {children}        │
 * └──────────┴─────────────────────┘
 *
 * - Project 목록(/)에는 쓰지 않는다. 작품 선택 후 경로에만 적용.
 * - Ctrl+K / ⌘K 로 프로젝트 전체 검색 팔레트를 연다.
 * - 사이드바 접힘 상태는 LocalStorage에 기억한다 (PC/iPad).
 * =============================================================================
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { GlobalSearchModal } from "@/features/global-search";
import { SectionRegistryProvider } from "@/features/sections";
import { getProjectById } from "@/features/projects/lib/project-storage";
import { SIDEBAR_COLLAPSED_KEY } from "@/lib/storage/keys";
import {
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";
import { cn } from "@/lib/utils/cn";
import type { ProjectId } from "@/types/ids";

export interface AppLayoutProps {
  /** URL의 작품 ID */
  projectId: string;
  children: ReactNode;
}

export function AppLayout({ projectId, children }: AppLayoutProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [titleLoading, setTitleLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 작품 제목 — Cloud/LocalStorage에서 읽기 (SSR 이후)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setTitleLoading(true);
      const project = await getProjectById(projectId);
      if (cancelled) return;
      setProjectTitle(project?.title ?? "알 수 없는 작품");
      setTitleLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // 접힘 상태 복원
  useEffect(() => {
    if (readStorageString(SIDEBAR_COLLAPSED_KEY) === "true") {
      setCollapsed(true);
    }
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl+K / Cmd+K — 전역 검색 토글
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      if (event.key.toLowerCase() !== "k") return;
      // 브라우저 주소창 검색 등 기본 동작 방지
      event.preventDefault();
      setSearchOpen((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeStorageString(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <SectionRegistryProvider projectId={projectId as ProjectId}>
      <div className="flex min-h-dvh min-h-screen bg-ns-canvas text-ns-ink">
        <Sidebar
          projectId={projectId}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
        />

        <div className={cn("flex min-w-0 flex-1 flex-col")}>
          <Header
            projectTitle={projectTitle}
            titleLoading={titleLoading}
            onOpenMobileMenu={() => setMobileOpen(true)}
            onOpenSearch={openSearch}
          />

          <main className="min-h-0 flex-1 overflow-y-auto bg-ns-canvas">
            {children}
          </main>
        </div>

        <GlobalSearchModal
          open={searchOpen}
          onClose={closeSearch}
          projectId={projectId}
          projectName={projectTitle}
        />
      </div>
    </SectionRegistryProvider>
  );
}
