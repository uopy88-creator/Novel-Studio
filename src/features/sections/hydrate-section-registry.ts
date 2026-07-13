/**
 * =============================================================================
 * Registry hydrate — Manuscript 와 동일한 로드 경로
 * -----------------------------------------------------------------------------
 * loadProjectManuscript → sectionRefsFromContent → publishSections
 * Timeline 전용 Section 조회 API 를 두지 않는다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import { loadProjectManuscript } from "@/features/manuscript/lib/project-manuscript";
import { sectionRefsFromContent } from "@/features/sections/section-list-from-content";
import {
  getSectionRegistrySnapshot,
  publishSections,
} from "@/features/sections/section-registry";

export interface HydrateSectionRegistryOptions {
  /**
   * true 이면 live 스냅샷도 persisted 로 덮어쓴다.
   * (창 focus 등 외부에서 Manuscript 가 바뀌었을 때)
   */
  force?: boolean;
}

/**
 * 현재 프로젝트 Manuscript 를 한 번 읽어 Registry 에 넣는다.
 * 이미 live 발행 중이면 force 없이는 건너뛴다.
 */
export async function hydrateSectionRegistry(
  projectId: ProjectId,
  options: HydrateSectionRegistryOptions = {},
): Promise<void> {
  const { force = false } = options;
  const current = getSectionRegistrySnapshot(projectId);

  if (!force && current.ready && current.source === "live") {
    return;
  }

  const { content, primaryDocumentId } =
    await loadProjectManuscript(projectId);

  publishSections(projectId, {
    sections: sectionRefsFromContent(content),
    primaryDocumentId,
    source: "persisted",
    force,
  });
}
