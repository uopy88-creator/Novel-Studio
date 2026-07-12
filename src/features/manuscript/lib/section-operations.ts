/**
 * =============================================================================
 * Section 조작 (추가 · 삭제 · 제목 · 순서)
 * -----------------------------------------------------------------------------
 * 모두 Section[] → serialize → Manuscript content 갱신으로 이어진다.
 * 번호는 항상 배열 순서로 자동 재계산한다. 사용자는 번호를 수정하지 않는다.
 * 안정 ID(id)는 순서 변경·제목 변경 시에도 유지한다.
 * =============================================================================
 */

import type {
  Section,
  SectionDelimiterConfig,
} from "@/features/manuscript/types/section";
import {
  DEFAULT_SECTION_DELIMITER,
  EMPTY_SECTION_ICONS,
} from "@/features/manuscript/types/section";
import {
  parseSections,
  serializeSections,
} from "@/features/manuscript/lib/section-parser";
import { createStableSectionId } from "@/features/manuscript/lib/section-ids";
import { countCharsWithoutSpaces } from "@/lib/stats";

/** 표시 번호만 다시 매긴다. 안정 ID(id)는 보존. */
function remumber(sections: Section[]): Section[] {
  return sections.map((section, index) => ({
    ...section,
    number: index + 1,
    charCount: countCharsWithoutSpaces(section.body),
  }));
}

/** 기본 새 Section 제목 — "Section 1", "Section 2", … */
export function defaultSectionTitle(number: number): string {
  return `Section ${Math.max(1, number)}`;
}

/** 드래그로 순서 변경 → Manuscript 본문도 같은 순서로 재배열 */
export function reorderSections(
  sections: Section[],
  activeId: string,
  overId: string,
): Section[] {
  const from = sections.findIndex((s) => s.id === activeId);
  const to = sections.findIndex((s) => s.id === overId);
  if (from < 0 || to < 0 || from === to) return sections;

  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return remumber(next);
}

/**
 * 맨 끝(또는 afterIndex 다음)에 빈 Section 추가.
 * 기본 제목 "Section N", 빈 본문, 상태 초안.
 */
export function addSection(
  sections: Section[],
  afterIndex?: number,
): Section[] {
  const insertAt =
    afterIndex === undefined ||
    afterIndex < 0 ||
    afterIndex >= sections.length - 1
      ? sections.length
      : afterIndex + 1;

  const blank: Section = {
    id: createStableSectionId(sections),
    number: 0,
    title: defaultSectionTitle(insertAt + 1),
    body: "",
    startOffset: 0,
    endOffset: 0,
    charCount: 0,
    status: "draft",
    memo: "",
    icons: { ...EMPTY_SECTION_ICONS },
  };

  const next = [...sections];
  next.splice(insertAt, 0, blank);
  return remumber(next);
}

/** Section 삭제 방식 */
export type SectionDeleteMode = "full" | "delimiter-only";

/**
 * Section 삭제
 * - full: Section 전체(구분자+본문) 제거
 * - delimiter-only: Section 구분만 제거하고 본문은 인접 Section에 병합
 * 최소 1개 Section은 유지한다.
 */
export function deleteSection(
  sections: Section[],
  sectionId: string,
  mode: SectionDeleteMode = "full",
): Section[] {
  if (sections.length <= 1) return sections;

  const index = sections.findIndex((s) => s.id === sectionId);
  if (index < 0) return sections;

  if (mode === "full") {
    return remumber(sections.filter((s) => s.id !== sectionId));
  }

  const target = sections[index];
  const body = target.body.replace(/^\n+/, "").replace(/\n+$/, "");
  const next = sections.filter((_, i) => i !== index);

  if (body) {
    if (index > 0) {
      const prevIndex = index - 1;
      const prev = next[prevIndex];
      const merged = [prev.body.replace(/\n+$/, ""), body]
        .filter(Boolean)
        .join("\n\n");
      next[prevIndex] = {
        ...prev,
        body: merged,
        charCount: countCharsWithoutSpaces(merged),
      };
    } else if (next.length > 0) {
      const first = next[0];
      const merged = [body, first.body.replace(/^\n+/, "")]
        .filter(Boolean)
        .join("\n\n");
      next[0] = {
        ...first,
        body: merged,
        charCount: countCharsWithoutSpaces(merged),
      };
    }
  }

  return remumber(next);
}

/** 제목만 수정 (번호·본문·안정 ID 유지) */
export function renameSection(
  sections: Section[],
  sectionId: string,
  title: string,
): Section[] {
  return remumber(
    sections.map((s) =>
      s.id === sectionId ? { ...s, title: title.trim() } : s,
    ),
  );
}

/** Section[] 변경을 원고 문자열로 반영 */
export function applySectionsToContent(
  sections: Section[],
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): string {
  return serializeSections(sections, config);
}

/** content 기준으로 파싱 후 조작 결과를 다시 content 로 */
export function withParsedSections(
  content: string,
  config: SectionDelimiterConfig,
  mutate: (sections: Section[]) => Section[],
): string {
  const sections = parseSections(content, config);
  return applySectionsToContent(mutate(sections), config);
}

/** @deprecated */
export type SceneDeleteMode = SectionDeleteMode;
/** @deprecated */
export const reorderScenes = reorderSections;
/** @deprecated */
export const addScene = addSection;
/** @deprecated */
export const deleteScene = deleteSection;
/** @deprecated */
export const renameScene = renameSection;
/** @deprecated */
export const applyScenesToContent = applySectionsToContent;
/** @deprecated */
export const withParsedScenes = withParsedSections;
