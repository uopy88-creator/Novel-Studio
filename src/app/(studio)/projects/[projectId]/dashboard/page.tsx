/**
 * Dashboard — 작품 현황 (보기 전용).
 * AppLayout은 projects/[projectId]/layout 에서 이미 감싼다.
 */

import { DashboardPage } from "@/features/dashboard";

interface DashboardRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DashboardRoutePage({
  params,
}: DashboardRoutePageProps) {
  const { projectId } = await params;
  return <DashboardPage projectId={projectId} />;
}
