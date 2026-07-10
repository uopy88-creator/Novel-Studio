/**
 * Inspiration — 영감 노트.
 * 사이드바 Inspiration 메뉴와 연결된다.
 */

import { InspirationPage } from "@/features/inspiration";

interface InspirationRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function InspirationRoutePage({
  params,
}: InspirationRoutePageProps) {
  const { projectId } = await params;
  return <InspirationPage projectId={projectId} />;
}
