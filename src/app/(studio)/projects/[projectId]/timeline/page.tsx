/**
 * Timeline — 사건을 시간순으로 정리.
 * ?documentId=&sectionId= (& sceneId= 레거시) 로 Section Navigator에서 연결할 수 있다.
 */

import { TimelinePage } from "@/features/timeline";

interface TimelineRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    documentId?: string;
    sectionId?: string;
    sceneId?: string;
  }>;
}

export default async function TimelineRoutePage({
  params,
  searchParams,
}: TimelineRoutePageProps) {
  const { projectId } = await params;
  const { documentId, sectionId, sceneId } = await searchParams;
  return (
    <TimelinePage
      projectId={projectId}
      initialDocumentId={documentId}
      initialSceneId={sectionId ?? sceneId}
    />
  );
}
