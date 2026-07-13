/**
 * =============================================================================
 * Manuscript content → SectionRef[]
 * -----------------------------------------------------------------------------
 * useSections / Registry hydrate 가 동일한 파서·구분자 설정을 쓴다.
 * Documents(Chapter) 목록은 사용하지 않는다.
 * =============================================================================
 */

import type { Section } from "@/features/manuscript/types/section";
import { DEFAULT_SECTION_DELIMITER } from "@/features/manuscript/types/section";
import { parseSections } from "@/features/manuscript/lib/section-parser";
import { readSectionDelimiterConfig } from "@/features/manuscript/lib/section-delimiter-settings";
import type { SectionRef } from "@/features/sections/section-registry";

function activeDelimiterConfig() {
  if (typeof window === "undefined") return DEFAULT_SECTION_DELIMITER;
  return readSectionDelimiterConfig();
}

/**
 * 빈 원고(공백만)는 선택 가능한 Section 이 없다.
 * parseSections("") 가 만드는 가상 Section 1개는 Timeline 목록에 올리지 않는다.
 */
export function isEmptyManuscriptContent(content: string): boolean {
  return !content.replace(/\s+/g, "").length;
}

/** Section[] → Registry 용 SectionRef[] */
export function sectionRefsFromSections(sections: Section[]): SectionRef[] {
  return sections.map((section) => ({
    id: section.id,
    number: section.number,
    title: section.title.trim() || "제목 없음",
  }));
}

/**
 * 원고 문자열에서 SectionRef 목록을 만든다.
 * Timeline / hydrate / Manuscript 가 같은 규칙을 공유한다.
 */
export function sectionRefsFromContent(content: string): SectionRef[] {
  if (isEmptyManuscriptContent(content)) return [];
  const sections = parseSections(content, activeDelimiterConfig());
  return sectionRefsFromSections(sections);
}
