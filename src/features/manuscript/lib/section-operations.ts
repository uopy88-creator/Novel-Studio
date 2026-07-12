/**
 * =============================================================================
 * Section 조작 (추가 · 삭제 · 제목 · 순서 · 커서에서 생성)
 * -----------------------------------------------------------------------------
 * 모두 Section[] → serialize → Manuscript content 갱신으로 이어진다.
 *
 * 번호 규칙
 * - 사용자는 번호를 직접 수정하지 않는다.
 * - 번호는 항상 배열 순서(1, 2, 3…)로 remumber / serialize 가 다시 매긴다.
 * - Drag · 삭제 · 삽입 후에도 빈 번호가 생기지 않는다.
 *
 * 생성 진입점 (반드시 createSection / createSectionAtCursor 만 사용)
 * - Section 페이지 「+ 새 Section」
 * - Manuscript 에서 줄에 `#` 입력 후 Enter
 * - 향후 추가 생성 UI
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

/** createSection 공통 결과 */
export interface CreateSectionResult {
  sections: Section[];
  newSectionId: string;
}

function buildBlankSection(
  existing: Section[],
  title: string,
): Section {
  return {
    id: createStableSectionId(existing),
    number: 0,
    title,
    body: "",
    startOffset: 0,
    endOffset: 0,
    charCount: 0,
    status: "draft",
    memo: "",
    icons: { ...EMPTY_SECTION_ICONS },
  };
}

/**
 * 공통 Section 생성.
 * 「+ 새 Section」과 동일한 기본값(초안·빈 본문·아이콘 없음)을 쓴다.
 *
 * @param afterIndex 이 인덱스 뒤에 삽입. 생략 시 맨 끝.
 * @param title 생략 시 "Section N"
 */
export function createSection(
  sections: Section[],
  options?: {
    afterIndex?: number;
    title?: string;
  },
): CreateSectionResult {
  const afterIndex = options?.afterIndex;
  const insertAt =
    afterIndex === undefined ||
    afterIndex < 0 ||
    afterIndex >= sections.length - 1
      ? sections.length
      : afterIndex + 1;

  const title =
    options?.title?.trim() || defaultSectionTitle(insertAt + 1);
  const blank = buildBlankSection(sections, title);

  const next = [...sections];
  next.splice(insertAt, 0, blank);
  return {
    sections: remumber(next),
    newSectionId: blank.id,
  };
}

/**
 * 맨 끝(또는 afterIndex 다음)에 빈 Section 추가.
 * 내부적으로 createSection 을 호출한다 (중복 로직 없음).
 */
export function addSection(
  sections: Section[],
  afterIndex?: number,
): Section[] {
  return createSection(sections, { afterIndex }).sections;
}

/** 드래그로 순서 변경 → Manuscript 본문도 같은 순서로 재배열 · 번호 재부여 */
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

/** Section 삭제 방식 */
export type SectionDeleteMode = "full" | "delimiter-only";

/**
 * Section 삭제 후 번호를 다시 매긴다 (빈 번호 없음).
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

/** Section[] 변경을 원고 문자열로 반영 (번호 자동 재부여) */
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

// ---------------------------------------------------------------------------
// Manuscript `#` + Enter → Section 생성
// ---------------------------------------------------------------------------

/**
 * 커서 줄이 Section 생성 트리거인지 판별.
 * - `#` / `# 제목` / `#3` / `#3 제목` (시스템이 붙인 ·ns: 태그 없음)
 * - 이미 `·ns:section_…` 가 있으면 정식 마커 → 트리거 아님
 */
export function getSectionTriggerAtCursor(
  content: string,
  cursorOffset: number,
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): { lineStart: number; lineEnd: number; title: string } | null {
  const text = content ?? "";
  const cursor = Math.max(0, Math.min(cursorOffset, text.length));

  const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
  let lineEnd = text.indexOf("\n", cursor);
  if (lineEnd < 0) lineEnd = text.length;

  // 줄 끝(또는 뒤쪽 공백만)에서 Enter 한 경우만
  const afterCursor = text.slice(cursor, lineEnd);
  if (afterCursor.trim() !== "") return null;

  const line = text.slice(lineStart, lineEnd);
  if (!line.trim()) return null;
  // 시스템이 관리하는 안정 ID 태그가 있으면 이미 정식 Section 마커
  if (line.includes("·ns:")) return null;

  const escaped = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // `#` 또는 `#12` 또는 `# 제목` / `#12 제목`
  const triggerRe = new RegExp(`^${escaped}(\\d+)?(?:[ \\t]+(.*))?$`);
  const match = triggerRe.exec(line);
  if (!match) return null;

  const title = (match[2] ?? "").trim();
  return { lineStart, lineEnd, title };
}

export interface CreateSectionAtCursorResult {
  /** 재번호·안정 ID 가 반영된 원고 */
  content: string;
  sections: Section[];
  newSectionId: string;
  /** 새 Section 본문 시작(헤더 다음) 캐럿 위치 */
  caretOffset: number;
}

/**
 * Manuscript 커서 줄의 `#` 트리거로 Section 을 만든다.
 * createSection 과 동일한 기본 상태·메타·직렬화 규칙을 쓴다.
 *
 * 트리거 줄은 제거하고, 그 위치를 기준으로 앞/뒤 원고를 나눈 뒤
 * 새 Section 을 끼워 넣는다. 번호는 serialize 가 1…N 으로 다시 매긴다.
 */
export function createSectionAtCursor(
  content: string,
  cursorOffset: number,
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): CreateSectionAtCursorResult | null {
  const trigger = getSectionTriggerAtCursor(content, cursorOffset, config);
  if (!trigger) return null;

  const text = content ?? "";
  const { lineStart, lineEnd, title } = trigger;
  const removeEnd = lineEnd < text.length ? lineEnd + 1 : lineEnd;

  const before = text.slice(0, lineStart).replace(/\n+$/, "");
  const after = text.slice(removeEnd).replace(/^\n+/, "");

  const leftSections =
    before.trim().length === 0 ? [] : parseSections(before, config);
  const rightSections =
    after.trim().length === 0 ? [] : parseSections(after, config);

  // left 끝에 새 Section 추가 (= createSection 공통 로직)
  const created = createSection(leftSections, {
    title: title || undefined,
  });
  const merged = remumber([...created.sections, ...rightSections]);

  const newContent = serializeSections(merged, config);
  const parsed = parseSections(newContent, config);
  const createdParsed =
    parsed.find((s) => s.id === created.newSectionId) ??
    parsed[Math.min(leftSections.length, parsed.length - 1)];

  // 캐럿: 새 Section 헤더 다음 줄 (본문 입력 위치)
  let caretOffset = createdParsed?.startOffset ?? 0;
  const headerEnd = newContent.indexOf("\n", caretOffset);
  if (headerEnd >= 0) {
    caretOffset = headerEnd + 1;
  } else {
    caretOffset = newContent.length;
  }

  return {
    content: newContent,
    sections: parsed,
    newSectionId: created.newSectionId,
    caretOffset,
  };
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
