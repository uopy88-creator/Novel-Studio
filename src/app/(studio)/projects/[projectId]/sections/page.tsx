/**
 * Section — 원고 구간 구조 관리.
 * Architecture: Project → Manuscript → Sections
 */

import { SectionsPage } from "@/features/manuscript/components/SectionsPage";

interface SectionsRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function SectionsRoutePage({
  params,
}: SectionsRoutePageProps) {
  const { projectId } = await params;
  return <SectionsPage projectId={projectId} />;
}
