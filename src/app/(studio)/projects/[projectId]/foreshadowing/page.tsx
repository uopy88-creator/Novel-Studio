/**
 * Foreshadowing — 복선 관리.
 * ?id= 로 특정 복선을 바로 연다 (전역 검색).
 */

import { ForeshadowingPage } from "@/features/foreshadowing";

interface ForeshadowingRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function ForeshadowingRoutePage({
  params,
  searchParams,
}: ForeshadowingRoutePageProps) {
  const { projectId } = await params;
  const { id } = await searchParams;
  return (
    <ForeshadowingPage projectId={projectId} initialForeshadowingId={id} />
  );
}
