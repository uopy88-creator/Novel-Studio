"use client";

/**
 * =============================================================================
 * useSectionLabel — Section ID → `#N 제목` (Registry 구독)
 * -----------------------------------------------------------------------------
 * 번호가 바뀌어도 ID 연결은 유지되고 라벨만 갱신된다.
 * =============================================================================
 */

import { useMemo } from "react";
import type { ProjectId } from "@/types/ids";
import { useSectionRegistry } from "@/features/sections/hooks/useSectionRegistry";
import { formatSectionRefLabel } from "@/features/sections/section-registry";

export function useSectionLabel(
  projectId: ProjectId,
  sectionId: string | null | undefined,
): string | null {
  const registry = useSectionRegistry(projectId);

  return useMemo(() => {
    if (!sectionId) return null;
    const ref = registry.sections.find((s) => s.id === sectionId);
    return ref ? formatSectionRefLabel(ref) : null;
  }, [registry.sections, sectionId]);
}
