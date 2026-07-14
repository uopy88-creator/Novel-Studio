/**
 * =============================================================================
 * Section 파서 / 직렬화
 * -----------------------------------------------------------------------------
 * Manuscript content(문자열) ↔ Section[] 변환.
 * DB에는 Section 본문 테이블을 두지 않고, 원고 본문만 저장한다.
 *
 * 마커(`#1 제목`)는 프로그램이 자동으로 기록·재번호한다.
 * 안정 ID는 마커 줄 끝의 `·ns:section_001` (또는 레거시 `·ns:scene_001`) 태그로 보존.
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
import { buildSectionMarkerRegex } from "@/features/manuscript/lib/section-delimiter-settings";
import {
  ensureStableSectionId,
  formatStableSectionId,
} from "@/features/manuscript/lib/section-ids";
import { stripHighlights } from "@/features/manuscript/lib/highlight-marks";
import { countCharsWithoutSpaces } from "@/lib/stats";

/** 마커 줄에 붙는 안정 ID 태그 — section_ / scene_ 모두 수용 */
const STABLE_ID_TAG_RE = /\s*·ns:((?:section|scene)_\d+)\s*$/;

/** 제목 문자열에서 안정 ID 태그를 분리한다. */
export function splitTitleAndStableId(rawTitle: string): {
  title: string;
  stableId?: string;
} {
  const match = STABLE_ID_TAG_RE.exec(rawTitle);
  if (!match) {
    return { title: rawTitle.trim() };
  }
  return {
    title: rawTitle.slice(0, match.index).trim(),
    stableId: match[1],
  };
}

/** 직렬화용: 제목 + 안정 ID 태그 */
function formatMarkerTitle(title: string, stableId: string): string {
  const clean = title.trim();
  const tag = `·ns:${stableId}`;
  return clean ? `${clean} ${tag}` : tag;
}

/**
 * 원고 문자열을 Section 목록으로 파싱한다.
 *
 * - 마커가 없으면 전체를 Section 1개로 본다.
 * - 마커 앞의 텍스트가 있으면 prologue 로 앞에 붙인 뒤 번호를 다시 매긴다.
 * - 안정 ID 태그가 없으면 순서 기반 section_NNN 을 부여한다.
 * - Highlight <mark> 는 plain 으로 제거한 뒤 오프셋을 계산한다.
 */
export function parseSections(
  content: string,
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): Section[] {
  const text = stripHighlights(content ?? "");
  const markerRe = buildSectionMarkerRegex(config);
  const lines = text.split("\n");

  type Draft = {
    number: number;
    title: string;
    stableId?: string;
    bodyLines: string[];
    startOffset: number;
  };

  const drafts: Draft[] = [];
  let offset = 0;
  let current: Draft | null = null;
  let prologueLines: string[] = [];
  let prologueStart = 0;
  let sawMarker = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineStart = offset;
    const match = markerRe.exec(line);

    if (match) {
      sawMarker = true;
      if (current) {
        drafts.push(current);
      } else if (prologueLines.length > 0) {
        drafts.push({
          number: 0,
          title: "",
          bodyLines: prologueLines,
          startOffset: prologueStart,
        });
        prologueLines = [];
      }

      const rawTitle = (match[2] ?? "").trim();
      const { title, stableId } = splitTitleAndStableId(rawTitle);

      current = {
        number: Number(match[1]) || drafts.length + 1,
        title,
        stableId,
        bodyLines: [],
        startOffset: lineStart,
      };
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      if (prologueLines.length === 0) prologueStart = lineStart;
      prologueLines.push(line);
    }

    offset += line.length + (i < lines.length - 1 ? 1 : 0);
  }

  if (current) {
    drafts.push(current);
  } else if (!sawMarker) {
    drafts.push({
      number: 1,
      title: "",
      bodyLines: prologueLines,
      startOffset: 0,
    });
  } else if (prologueLines.length > 0) {
    drafts.unshift({
      number: 0,
      title: "",
      bodyLines: prologueLines,
      startOffset: prologueStart,
    });
  }

  const used = new Set<string>();
  const sections: Section[] = drafts.map((draft, index) => {
    const body = draft.bodyLines
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    const number = index + 1;
    const endOffset =
      index + 1 < drafts.length
        ? drafts[index + 1].startOffset
        : text.length;

    let id = ensureStableSectionId(draft.stableId, number);
    if (used.has(id)) {
      id = formatStableSectionId(number);
      let n = number;
      while (used.has(id)) {
        n += 1;
        id = formatStableSectionId(n);
      }
    }
    used.add(id);

    return {
      id,
      number,
      title: draft.title,
      body,
      startOffset: draft.startOffset,
      endOffset,
      charCount: countCharsWithoutSpaces(body),
      status: "draft" as const,
      memo: "",
      icons: { ...EMPTY_SECTION_ICONS },
    };
  });

  return sections;
}

/**
 * Section 목록을 원고 문자열로 다시 합친다.
 * 번호는 배열 순서대로 1, 2, 3… 으로 다시 매기고, 안정 ID 태그를 붙인다.
 */
export function serializeSections(
  sections: Section[],
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): string {
  if (sections.length === 0) return "";

  // Section 이 하나이고 제목이 비어 있으면 마커 없이 본문만 (기존 원고 호환)
  if (sections.length === 1 && !sections[0].title.trim()) {
    return sections[0].body;
  }

  return sections
    .map((section, index) => {
      const number = index + 1;
      const stableId = ensureStableSectionId(section.id, number);
      const header = `${config.prefix}${number} ${formatMarkerTitle(section.title, stableId)}`;
      const body = section.body.replace(/^\n+/, "").replace(/\n+$/, "");
      return body ? `${header}\n${body}` : header;
    })
    .join("\n\n");
}

/** 스크롤용: Section 시작 오프셋 */
export function findSectionStartOffset(
  content: string,
  sectionIndex: number,
  config: SectionDelimiterConfig = DEFAULT_SECTION_DELIMITER,
): number {
  const sections = parseSections(content, config);
  return sections[sectionIndex]?.startOffset ?? 0;
}

/** @deprecated Use parseSections */
export const parseScenes = parseSections;
/** @deprecated Use serializeSections */
export const serializeScenes = serializeSections;
/** @deprecated Use findSectionStartOffset */
export const findSceneStartOffset = findSectionStartOffset;
