"use client";

/**
 * =============================================================================
 * useSectionOptions — Registry 구독 → 공통 선택 옵션
 * -----------------------------------------------------------------------------
 * Timeline / Foreshadowing / Memo 등이 동일 훅으로 목록을 읽는다.
 * =============================================================================
 */

import { useMemo } from "react";
import type { ProjectId } from "@/types/ids";
import { useSectionRegistry } from "@/features/sections/hooks/useSectionRegistry";
import {
  sectionOptionsFromRefs,
  type SectionOption,
} from "@/features/sections/section-options";

export function useSectionOptions(projectId: ProjectId): {
  options: SectionOption[];
  ready: boolean;
  primaryDocumentId: ReturnType<
    typeof useSectionRegistry
  >["primaryDocumentId"];
  generation: number;
} {
  const registry = useSectionRegistry(projectId);

  const options = useMemo(
    () =>
      sectionOptionsFromRefs(registry.sections, registry.primaryDocumentId),
    [registry.sections, registry.primaryDocumentId],
  );

  return {
    options,
    ready: registry.ready,
    primaryDocumentId: registry.primaryDocumentId,
    generation: registry.generation,
  };
}
