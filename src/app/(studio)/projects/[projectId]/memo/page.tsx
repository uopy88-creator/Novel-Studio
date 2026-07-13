/**
 * Memo — 목록 · Pin · Selection Action 연동
 */

import { MemoPageClient } from "@/features/memo/components/MemoPageClient";
import type { ProjectId } from "@/types/ids";

interface MemoPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function MemoRoutePage({
  params,
  searchParams,
}: MemoPageProps) {
  const { projectId } = await params;
  const { id } = await searchParams;
  return (
    <MemoPageClient
      projectId={projectId as ProjectId}
      initialMemoId={id}
    />
  );
}
