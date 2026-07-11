/**
 * Manuscript — Document 선택 후 원고 편집.
 * ?documentId= & offset= & end= & sceneId= 로 딥링크 (전역 검색).
 */

import { ManuscriptWorkspace } from "@/features/manuscript/components/ManuscriptWorkspace";

interface ManuscriptRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    documentId?: string;
    offset?: string;
    end?: string;
    sceneId?: string;
  }>;
}

function parseOptionalInt(value?: string): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ManuscriptRoutePage({
  params,
  searchParams,
}: ManuscriptRoutePageProps) {
  const { projectId } = await params;
  const { documentId, offset, end, sceneId } = await searchParams;
  return (
    <ManuscriptWorkspace
      projectId={projectId}
      initialDocumentId={documentId}
      initialOffset={parseOptionalInt(offset)}
      initialEnd={parseOptionalInt(end)}
      initialSceneId={sceneId}
    />
  );
}
