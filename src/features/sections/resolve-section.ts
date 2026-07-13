/**
 * =============================================================================
 * Section 해석 유틸 (읽기 전용)
 * -----------------------------------------------------------------------------
 * ID → 라벨, 오프셋 → Section ID. Manuscript content 파싱이 필요할 때만 사용.
 * Section 목록 자체는 Registry 를 우선한다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import { DEFAULT_SECTION_DELIMITER } from "@/features/manuscript/types/section";
import { parseSections } from "@/features/manuscript/lib/section-parser";
import { readSectionDelimiterConfig } from "@/features/manuscript/lib/section-delimiter-settings";
import {
  formatSectionRefLabel,
  getSectionRegistrySnapshot,
  type SectionRef,
} from "@/features/sections/section-registry";
import { isEmptyManuscriptContent } from "@/features/sections/section-list-from-content";

function activeDelimiterConfig() {
  if (typeof window === "undefined") return DEFAULT_SECTION_DELIMITER;
  return readSectionDelimiterConfig();
}

/** Registry 에서 Section ID 로 Ref 조회 */
export function findSectionRefById(
  projectId: ProjectId,
  sectionStableId: string | null | undefined,
): SectionRef | null {
  if (!sectionStableId) return null;
  const snap = getSectionRegistrySnapshot(projectId);
  return snap.sections.find((s) => s.id === sectionStableId) ?? null;
}

/** Registry 기준 표시 라벨. 없으면 null (연결 해제) */
export function resolveSectionLabel(
  projectId: ProjectId,
  sectionStableId: string | null | undefined,
): string | null {
  const ref = findSectionRefById(projectId, sectionStableId);
  return ref ? formatSectionRefLabel(ref) : null;
}

/**
 * 원고 오프셋이 속한 Section 안정 ID.
 * Registry 는 오프셋을 갖지 않으므로 content 를 한 번 파싱한다.
 * (목록 생성용이 아니라 위치→ID 해석 전용)
 */
export function findSectionStableIdAtOffset(
  content: string,
  offset: number,
): string | null {
  if (isEmptyManuscriptContent(content)) return null;
  const sections = parseSections(content, activeDelimiterConfig());
  if (sections.length === 0) return null;

  const clamped = Math.max(0, offset);
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    if (clamped >= sections[i].startOffset) {
      return sections[i].id;
    }
  }
  return sections[0]?.id ?? null;
}

/**
 * Search 등: Registry 목록 + content 파싱 바디/오프셋을 ID 로 병합.
 * 목록 순서는 Registry(SSOT) 를 따른다.
 */
export function mergeSectionBodiesById(
  refs: SectionRef[],
  content: string,
): Array<SectionRef & { body: string; startOffset: number }> {
  if (refs.length === 0) return [];

  const parsed = isEmptyManuscriptContent(content)
    ? []
    : parseSections(content, activeDelimiterConfig());
  const byId = new Map(parsed.map((s) => [s.id, s]));

  return refs.map((ref) => {
    const hit = byId.get(ref.id);
    return {
      ...ref,
      body: hit?.body ?? "",
      startOffset: hit?.startOffset ?? 0,
    };
  });
}
