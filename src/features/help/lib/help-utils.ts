/**
 * =============================================================================
 * Help 검색 · 트리 유틸
 * =============================================================================
 */

import type {
  HelpBlock,
  HelpDocument,
  HelpSection,
} from "@/features/help/types/help";

export interface FlatHelpSection {
  id: string;
  title: string;
  depth: number;
  parentId: string | null;
}

function blockText(block: HelpBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "shortcut":
      return `${block.keys} ${block.action}`;
    case "faq":
      return `${block.question} ${block.answer}`;
    default:
      return "";
  }
}

export function sectionSearchText(section: HelpSection): string {
  const own = [
    section.title,
    ...(section.blocks ?? []).map(blockText),
  ].join(" ");
  const kids = (section.children ?? []).map(sectionSearchText).join(" ");
  return `${own} ${kids}`;
}

/** 검색어에 맞는 섹션 id 집합 (조상 포함) */
export function collectMatchingSectionIds(
  doc: HelpDocument,
  rawQuery: string,
): Set<string> | null {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return null;

  const matched = new Set<string>();

  const walk = (section: HelpSection, ancestors: string[]): boolean => {
    const selfHit = sectionSearchText(section).toLowerCase().includes(q);
    // children 개별 매치도 확인 (제목만 짧게)
    let childHit = false;
    for (const child of section.children ?? []) {
      if (walk(child, [...ancestors, section.id])) childHit = true;
    }
    if (selfHit || childHit) {
      matched.add(section.id);
      for (const id of ancestors) matched.add(id);
      return true;
    }
    return false;
  };

  for (const section of doc.sections) {
    walk(section, []);
  }
  return matched;
}

/** TOC / Spy 용 평탄 목록 */
export function flattenSections(
  sections: HelpSection[],
  depth = 0,
  parentId: string | null = null,
): FlatHelpSection[] {
  const out: FlatHelpSection[] = [];
  for (const section of sections) {
    out.push({
      id: section.id,
      title: section.title,
      depth,
      parentId,
    });
    if (section.children?.length) {
      out.push(...flattenSections(section.children, depth + 1, section.id));
    }
  }
  return out;
}

/** 접기 가능한 부모 id 목록 */
export function collapsibleParentIds(sections: HelpSection[]): string[] {
  const ids: string[] = [];
  const walk = (list: HelpSection[]) => {
    for (const s of list) {
      if (s.children?.length) {
        ids.push(s.id);
        walk(s.children);
      }
    }
  };
  walk(sections);
  return ids;
}
