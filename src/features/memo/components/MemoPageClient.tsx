"use client";

/**
 * Memo 페이지도 Section Registry 를 구독한다.
 * (ComingSoon UI 유지 — Section 목록을 따로 만들지 않음)
 */

import type { ProjectId } from "@/types/ids";
import { useSectionRegistry } from "@/features/sections";
import { ComingSoon } from "@/components/layout";

export function MemoPageClient({ projectId }: { projectId: ProjectId }) {
  useSectionRegistry(projectId);

  return (
    <ComingSoon featureName="Memo" helpTopic="memo" projectId={projectId} />
  );
}
