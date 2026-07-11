/**
 * Timeline — 사건을 시간순으로 정리.
 * ?documentId=&sceneId= 로 Scene Navigator에서 연결할 수 있다.
 */

import { TimelinePage } from "@/features/timeline";

interface TimelineRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    documentId?: string;
    sceneId?: string;
  }>;
}

export default async function TimelineRoutePage({
  params,
  searchParams,
}: TimelineRoutePageProps) {
  const { projectId } = await params;
  const { documentId, sceneId } = await searchParams;
  return (
    <TimelinePage
      projectId={projectId}
      initialDocumentId={documentId}
      initialSceneId={sceneId}
    />
  );
}
