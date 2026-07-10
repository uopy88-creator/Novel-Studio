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
 * - Dashboard 등 기능 구현은 하지 않고, 레이아웃만 제공한다.
 * - 사이드바 접힘 상태는 LocalStorage에 기억한다 (PC/iPad).
 * =============================================================================
 */

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getProjectById } from "@/features/projects/lib/project-storage";
import { cn } from "@/lib/utils/cn";

/** 사이드바 접힘 상태 저장 키 */
const SIDEBAR_COLLAPSED_KEY = "novel-studio:sidebar-collapsed";

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

  // 작품 제목 — LocalStorage에서 읽기 (SSR 이후)
  useEffect(() => {
    const project = getProjectById(projectId);
    setProjectTitle(project?.title ?? "알 수 없는 작품");
    setTitleLoading(false);
  }, [projectId]);

  // 접힘 상태 복원
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (raw === "true") setCollapsed(true);
    } catch {
      // storage 접근 실패 시 기본값(펼침) 유지
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-ns-canvas text-ns-ink">
      <Sidebar
        projectId={projectId}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />

      {/*
        메인 컬럼.
        모바일에서 fixed 사이드바가 공간을 안 차지하므로 flex-1만으로 충분하다.
      */}
      <div className={cn("flex min-w-0 flex-1 flex-col")}>
        <Header
          projectTitle={projectTitle}
          titleLoading={titleLoading}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="min-h-0 flex-1 overflow-y-auto bg-ns-canvas">
          {children}
        </main>
      </div>
    </div>
  );
}
