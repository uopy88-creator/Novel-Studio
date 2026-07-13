"use client";

/**
 * =============================================================================
 * useSectionRegistry — Registry 구독 훅
 * -----------------------------------------------------------------------------
 * Timeline 등 읽기 전용 소비자가 Section 목록을 구독한다.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import type { ProjectId } from "@/types/ids";
import {
  getSectionRegistrySnapshot,
  subscribeSectionRegistry,
  type SectionRegistrySnapshot,
} from "@/features/sections/section-registry";

export function useSectionRegistry(
  projectId: ProjectId,
): SectionRegistrySnapshot {
  const [snapshot, setSnapshot] = useState<SectionRegistrySnapshot>(() =>
    getSectionRegistrySnapshot(projectId),
  );

  useEffect(() => {
    setSnapshot(getSectionRegistrySnapshot(projectId));
    return subscribeSectionRegistry(projectId, () => {
      setSnapshot(getSectionRegistrySnapshot(projectId));
    });
  }, [projectId]);

  return snapshot;
}
