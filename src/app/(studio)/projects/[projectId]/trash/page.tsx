/**
 * Trash — Soft Delete 휴지통 페이지
 */

import { TrashPage } from "@/features/trash/components/TrashPage";
import type { ProjectId } from "@/types/ids";

interface TrashRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function TrashRoutePage({ params }: TrashRoutePageProps) {
  const { projectId } = await params;
  return <TrashPage projectId={projectId as ProjectId} />;
}
