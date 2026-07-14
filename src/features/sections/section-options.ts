/**
 * =============================================================================
 * Section 선택 옵션 — 전역 공통 어댑터
 * -----------------------------------------------------------------------------
 * Timeline / (향후) Foreshadowing·Memo 등이 각자 목록을 만들지 않고
 * Registry SectionRef 만 이 형식으로 변환한다.
 * =============================================================================
 */

import type { DocumentId } from "@/types/ids";
import {
  formatSectionRefLabel,
  type SectionRef,
} from "@/features/sections/section-registry";

/** 공통 Section 선택지 (읽기 전용) */
export interface SectionOption {
  /** select value = sectionId (= SectionRef.id) */
  value: string;
  /** 딥링크용 primary Manuscript Document ID (목록 소스 아님) */
  documentId: DocumentId;
  /**
   * Section 안정 ID — 저장·연결에 사용
   * @deprecated 신규 코드는 sectionId 사용
   */
  sectionStableId: string;
  /** sectionId (= SectionRef.id) — 권장 */
  sectionId: string;
  /** 표시용 번호 (재정렬 시 변경될 수 있음) */
  sectionNumber: number;
  sectionTitle: string;
  /** `#1 프롤로그` */
  label: string;
}

/**
 * Registry SectionRef[] → 공통 선택 옵션.
 * documentId 는 딥링크용이며 Section 목록 조회에 쓰지 않는다.
 */
export function sectionOptionsFromRefs(
  refs: SectionRef[],
  primaryDocumentId: DocumentId | null,
): SectionOption[] {
  const documentId = (primaryDocumentId ?? "") as DocumentId;
  return refs.map((ref) => ({
    value: ref.id,
    documentId,
    sectionId: ref.id,
    sectionStableId: ref.id,
    sectionNumber: ref.number,
    sectionTitle: ref.title,
    label: formatSectionRefLabel(ref),
  }));
}
