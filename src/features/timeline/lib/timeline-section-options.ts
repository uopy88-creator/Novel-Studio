/**
 * =============================================================================
 * Timeline ↔ Section 옵션
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * Timeline 은 Section 만 사용한다.
 * 예전 multi-Document(Chapter) 원고는 무시하고, primary Manuscript 의
 * Section 목록만 Section 순서(#N)대로 제공한다.
 * =============================================================================
 */

import type { DocumentId, ProjectId } from "@/types/ids";
import { loadProjectManuscript } from "@/features/manuscript/lib/project-manuscript";
import { parseSections } from "@/features/manuscript/lib/section-parser";

/** Section 선택지 — Document(구 Chapter) 제목은 노출하지 않는다 */
export interface TimelineSectionOption {
  /** select value — section 안정 ID (또는 레거시 `${documentId}::${id}`) */
  value: string;
  /** 숨은 Manuscript Document ID (저장용, UI 비표시) */
  documentId: DocumentId;
  /** Section 안정 ID — section_001 / 레거시 scene_001 */
  sectionStableId: string;
  /** Manuscript 안 Section 순서 (1-based) */
  sectionNumber: number;
  sectionTitle: string;
  /** UI 라벨 — `1. 제목` */
  label: string;
}

/** @deprecated TimelineSectionOption 별칭 */
export type TimelineSceneOption = TimelineSectionOption;

/**
 * 선택값 인코딩.
 * - 신규: sectionStableId 만
 * - 레거시 저장값: documentId::sectionStableId (읽기 호환)
 */
export function encodeSectionOptionValue(
  documentId: string,
  sectionStableId: string,
): string {
  // UI value 는 section id 단독. documentId 는 제출 시 primary 로 채운다.
  void documentId;
  return sectionStableId;
}

/** @deprecated */
export const encodeSceneOptionValue = encodeSectionOptionValue;

/**
 * 선택값 디코딩.
 * - `section_001` / `scene_001` → sectionStableId
 * - `uuid::section_001` → 레거시 documentId + sectionStableId
 */
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

/**
 * primary Manuscript 의 Section 만 로드한다.
 * Section 순서 = Manuscript 파서 순서 (reorder 와 동일).
 */
export async function loadTimelineSectionOptions(
  projectId: ProjectId,
): Promise<TimelineSectionOption[]> {
  const { content, primaryDocumentId } =
    await loadProjectManuscript(projectId);
  const sections = parseSections(content ?? "");

  return sections.map((section) => {
    const sectionTitle = section.title.trim() || "제목 없음";
    return {
      value: section.id,
      documentId: primaryDocumentId,
      sectionStableId: section.id,
      sectionNumber: section.number,
      sectionTitle,
      label: `${section.number}. ${sectionTitle}`,
    };
  });
}

/** @deprecated loadTimelineSectionOptions 별칭 */
export const loadTimelineSceneOptions = loadTimelineSectionOptions;
