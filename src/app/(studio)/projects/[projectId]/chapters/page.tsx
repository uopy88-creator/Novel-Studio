/**
 * Chapters 메뉴 — Document 목록 관리.
 * (제품 언어: Document, 라우트 세그먼트는 chapters 유지)
 */

import { DocumentsPage } from "@/features/manuscript/components/DocumentsPage";

interface ChaptersRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ChaptersRoutePage({
  params,
}: ChaptersRoutePageProps) {
  const { projectId } = await params;
  return <DocumentsPage projectId={projectId} />;
}
