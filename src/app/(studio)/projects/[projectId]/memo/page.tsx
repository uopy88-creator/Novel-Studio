/**
 * Memo — Context Help + Section Registry 구독 (UI ComingSoon 유지)
 */

import { MemoPageClient } from "@/features/memo/components/MemoPageClient";
import type { ProjectId } from "@/types/ids";

interface MemoPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MemoPage({ params }: MemoPageProps) {
  const { projectId } = await params;
  return <MemoPageClient projectId={projectId as ProjectId} />;
}
