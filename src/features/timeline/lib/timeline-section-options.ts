/**
 * =============================================================================
 * Timeline ↔ Section 옵션 (Registry 어댑터)
 * -----------------------------------------------------------------------------
 * 공통 SectionOption 을 Timeline 타입 별칭으로 재노출한다.
 * Documents(Chapter) 를 조회하지 않는다.
 * =============================================================================
 */

import type { DocumentId } from "@/types/ids";
import {
  sectionOptionsFromRefs,
  type SectionOption,
} from "@/features/sections/section-options";
import type { SectionRef } from "@/features/sections/section-registry";

/** @deprecated SectionOption 사용 — Timeline 전용 목록을 만들지 말 것 */
export type TimelineSectionOption = SectionOption;

/** @deprecated */
export type TimelineSceneOption = TimelineSectionOption;

export function encodeSectionOptionValue(
  documentId: string,
  sectionStableId: string,
): string {
  void documentId;
  return sectionStableId;
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

/** Registry → Timeline 옵션 (공통 어댑터 위임) */
export function timelineOptionsFromSectionRefs(
  refs: SectionRef[],
  primaryDocumentId: DocumentId | null,
): TimelineSectionOption[] {
  return sectionOptionsFromRefs(refs, primaryDocumentId);
}

/** @deprecated useSectionOptions / Section Registry */
export async function loadTimelineSectionOptions(): Promise<
  TimelineSectionOption[]
> {
  console.warn(
    "[timeline-section-options] deprecated; use Section Registry / useSectionOptions",
  );
  return [];
}

/** @deprecated */
export const loadTimelineSceneOptions = loadTimelineSectionOptions;
