/**
 * Inspiration — 영감 노트.
 * ?id= 로 특정 노트를 바로 연다 (전역 검색).
 */

import { InspirationPage } from "@/features/inspiration";

interface InspirationRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function InspirationRoutePage({
  params,
  searchParams,
}: InspirationRoutePageProps) {
  const { projectId } = await params;
  const { id } = await searchParams;
  return (
    <InspirationPage projectId={projectId} initialInspirationId={id} />
  );
}
