/**
 * =============================================================================
 * Timeline ↔ Section 옵션 (Registry 어댑터 — thin)
 * -----------------------------------------------------------------------------
 * 목록은 useSectionOptions / listSectionOptions 를 쓴다.
 * 이 파일은 Timeline 타입 별칭·레거시 encode/decode 만 남긴다.
 * =============================================================================
 */

import type { DocumentId } from "@/types/ids";
import {
  listSectionOptions,
  sectionOptionsFromRefs,
  type SectionOption,
} from "@/features/sections";
import type { SectionRef } from "@/features/sections";

/** @deprecated SectionOption 사용 */
export type TimelineSectionOption = SectionOption;

/** @deprecated */
export type TimelineSceneOption = TimelineSectionOption;

export function encodeSectionOptionValue(
  documentId: string,
  sectionId: string,
): string {
  void documentId;
  return sectionId;
}

/** @deprecated */
export const encodeSceneOptionValue = encodeSectionOptionValue;

export function decodeSectionOptionValue(
  value: string,
): { documentId?: string; sectionStableId: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const sep = trimmed.indexOf("::");
  if (sep > 0) {
    const documentId = trimmed.slice(0, sep);
    const sectionStableId = trimmed.slice(sep + 2);
    if (!documentId || !sectionStableId) return null;
    return { documentId, sectionStableId };
  }

  return { sectionStableId: trimmed };
}

/** @deprecated */
export const decodeSceneOptionValue = decodeSectionOptionValue;

/** @deprecated listSectionOptions(projectId) / useSectionOptions 사용 */
export function timelineOptionsFromSectionRefs(
  refs: SectionRef[],
  primaryDocumentId: DocumentId | null,
): TimelineSectionOption[] {
  return sectionOptionsFromRefs(refs, primaryDocumentId);
}

/** @deprecated useSectionOptions / listSectionOptions */
export async function loadTimelineSectionOptions(
  projectId?: string,
): Promise<TimelineSectionOption[]> {
  if (!projectId) {
    console.warn(
      "[timeline-section-options] deprecated; pass projectId or use useSectionOptions",
    );
    return [];
  }
  return listSectionOptions(projectId as import("@/types/ids").ProjectId);
}

/** @deprecated */
export const loadTimelineSceneOptions = loadTimelineSectionOptions;
