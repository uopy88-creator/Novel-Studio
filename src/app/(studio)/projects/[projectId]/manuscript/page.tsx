/**
 * Manuscript — Document 선택 후 원고 편집.
 * ?documentId= 로 특정 Document를 바로 열 수 있다.
 */

import { ManuscriptWorkspace } from "@/features/manuscript";

interface ManuscriptRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    documentId?: string;
  }>;
}

export default async function ManuscriptRoutePage({
  params,
  searchParams,
}: ManuscriptRoutePageProps) {
  const { projectId } = await params;
  const { documentId } = await searchParams;
  return (
    <ManuscriptWorkspace
      projectId={projectId}
      initialDocumentId={documentId}
    />
  );
}
