"use client";

/**
 * Memo 페이지 — Section Registry 구독 + MemoPage
 */

import type { ProjectId } from "@/types/ids";
import { MemoPage } from "@/features/memo/components/MemoPage";

export function MemoPageClient({
  projectId,
  initialMemoId,
}: {
  projectId: ProjectId;
  initialMemoId?: string;
}) {
  return <MemoPage projectId={projectId} initialMemoId={initialMemoId} />;
}
