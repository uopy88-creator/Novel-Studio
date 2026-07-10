import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout";

/**
 * =============================================================================
 * 작품 작업실 공통 레이아웃
 * -----------------------------------------------------------------------------
 * /projects/[projectId]/* 아래 모든 페이지가 동일한 AppLayout을 쓴다.
 * Project 목록(/)에는 적용되지 않는다.
 *
 * Dashboard 등 기능 구현은 하지 않는다 — 껍데기(레이아웃)만 연결한다.
 * =============================================================================
 */
export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <AppLayout projectId={projectId}>{children}</AppLayout>;
}
