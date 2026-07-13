/**
 * =============================================================================
 * Timeline ↔ Section 옵션 (Registry 어댑터)
 * -----------------------------------------------------------------------------
 * Section 목록은 Section Registry(SSOT) 에서만 온다.
 * Documents(Chapter) 를 조회하지 않는다.
 * =============================================================================
 */

import type { DocumentId } from "@/types/ids";
import {
  formatSectionRefLabel,
  type SectionRef,
} from "@/features/sections/section-registry";

/** Section 선택지 — Registry SectionRef 를 Timeline UI 에 맞게 변환 */
export interface TimelineSectionOption {
  /** select value — section 안정 ID */
  value: string;
  /**
   * 숨은 primary Manuscript Document ID (딥링크 저장용).
   * Section 목록 소스가 아니다.
   */
  documentId: DocumentId;
  /** Section 안정 ID — section_001 / 레거시 scene_001 */
  sectionStableId: string;
  /** Manuscript 안 Section 표시 번호 (1-based) */
  sectionNumber: number;
  sectionTitle: string;
  /** UI 라벨 — `#1 프롤로그` */
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
 * Registry SectionRef → Timeline 선택 옵션.
 * documentId 는 딥링크용 primary 만 붙인다 (목록 조회에 사용하지 않음).
 */
export function timelineOptionsFromSectionRefs(
  refs: SectionRef[],
  primaryDocumentId: DocumentId | null,
): TimelineSectionOption[] {
  const documentId = (primaryDocumentId ?? "") as DocumentId;
  return refs.map((ref) => ({
    value: ref.id,
    documentId,
    sectionStableId: ref.id,
    sectionNumber: ref.number,
    sectionTitle: ref.title,
    label: formatSectionRefLabel(ref),
  }));
}

/**
 * @deprecated Registry 를 사용하세요. 하위 호환용 no-op 래퍼는 제거됨 —
 * sync / hook 이 Registry 스냅샷을 직접 쓴다.
 */
export async function loadTimelineSectionOptions(): Promise<
  TimelineSectionOption[]
> {
  console.warn(
    "[timeline-section-options] loadTimelineSectionOptions is deprecated; use Section Registry",
  );
  return [];
}

/** @deprecated */
export const loadTimelineSceneOptions = loadTimelineSectionOptions;
