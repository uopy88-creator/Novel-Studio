/**
 * =============================================================================
 * Chapter → Section 마이그레이션
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (one hidden Document) → Sections (#N markers)
 *
 * Legacy data may have multiple Documents with chapter delimiter blocks
 * (`================` / `⟦ns:chapter:…⟧`). This module merges them into one
 * manuscript on the primary hidden Document and renumbers section metas.
 *
 * 레거시: Document 여러 개 + 챕터 구분선. 마이그레이션 후 Section(#N) 하나의
 * 원고로 합치고, 메타는 primary Document 기준 전역 번호로 재매핑한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Section, SectionMeta } from "@/features/manuscript/types/section";
import {
  DEFAULT_SECTION_DELIMITER,
  EMPTY_SECTION_ICONS,
} from "@/features/manuscript/types/section";
import type { ChapterId, ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import {
  getManuscriptByChapterId,
  saveManuscriptContent,
} from "@/features/manuscript/lib/manuscript-storage";
import { joinChapterBodies } from "@/features/manuscript/lib/chapter-blocks";
import {
  parseSections,
  serializeSections,
} from "@/features/manuscript/lib/section-parser";
import { defaultSectionTitle } from "@/features/manuscript/lib/section-operations";
import {
  createStableSectionId,
  ensureStableSectionId,
  isSectionStableId,
} from "@/features/manuscript/lib/section-ids";
import { buildSectionMarkerRegex } from "@/features/manuscript/lib/section-delimiter-settings";
import {
  readSectionMetasByDocument,
  saveSectionMetasForDocument,
} from "@/features/manuscript/lib/section-meta-storage";
import { ensureManuscriptDocument } from "@/features/manuscript/lib/ensure-manuscript-document";
import { SECTIONS_MIGRATION_FLAG_KEY } from "@/lib/storage/keys";
import { readJsonArray, writeJsonArray } from "@/lib/storage/browser";
import { countCharsWithoutSpaces } from "@/lib/stats";

const CHAPTER_RULE = "================";
const CHAPTER_ID_LINE_RE = /^⟦ns:chapter:[^|\]]+(?:\|.*)?⟧.*$/;

export interface MigrateToSectionsResult {
  migrated: boolean;
  content: string;
  primaryDocumentId: string;
  sectionCount: number;
}

/** `${documentId}:${sectionNumber}` → new global section number */
export type SectionNumberMigrationMap = Map<string, number>;

function migrationMapKey(documentId: ChapterId, sectionNumber: number): string {
  return `${documentId}:${sectionNumber}`;
}

function readMigratedProjectIds(): ProjectId[] {
  return readJsonArray<string>(SECTIONS_MIGRATION_FLAG_KEY) as ProjectId[];
}

function markProjectMigrated(projectId: ProjectId): void {
  const ids = readMigratedProjectIds();
  if (ids.includes(projectId)) return;
  writeJsonArray(SECTIONS_MIGRATION_FLAG_KEY, [...ids, projectId]);
}

/** Joined content still has legacy chapter delimiter blocks */
export function contentNeedsSectionMigration(content: string): boolean {
  if (!content) return false;
  if (content.includes(CHAPTER_RULE)) return true;
  if (content.includes("⟦ns:chapter:")) return true;
  return false;
}

function trimBody(body: string): string {
  return body.replace(/^\n+/, "").replace(/\n+$/, "");
}

/** Chapter body contains `#N` section markers (not just plain prose) */
function chapterBodyHasSectionMarkers(body: string): boolean {
  const trimmed = trimBody(body);
  const markerRe = buildSectionMarkerRegex(DEFAULT_SECTION_DELIMITER);
  for (const line of body.split("\n")) {
    if (markerRe.test(line)) return true;
  }

  const sections = parseSections(body);
  if (sections.length > 1) return true;
  if (sections.length === 1) {
    const only = sections[0];
    if (only.title.trim()) return true;
    return only.body !== trimmed;
  }
  return false;
}

function remumberFlattenedSections(sections: Section[]): Section[] {
  const built: Section[] = [];
  return sections.map((section, index) => {
    const number = index + 1;
    let id = section.id;
    if (!isSectionStableId(id)) {
      id = createStableSectionId(built);
    } else {
      id = ensureStableSectionId(id, number);
    }

    const next: Section = {
      ...section,
      id,
      number,
      charCount: countCharsWithoutSpaces(section.body),
      startOffset: 0,
      endOffset: 0,
    };
    built.push(next);
    return next;
  });
}

/** Remove leftover chapter delimiter lines from merged section content */
export function stripChapterDelimiters(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (
      line.trim() === CHAPTER_RULE &&
      i + 2 < lines.length &&
      lines[i + 2].trim() === CHAPTER_RULE
    ) {
      i += 3;
      while (i < lines.length && lines[i] === "") i += 1;
      continue;
    }
    if (CHAPTER_ID_LINE_RE.test(line.trim())) {
      i += 1;
      continue;
    }
    if (line.trim() === CHAPTER_RULE) {
      i += 1;
      continue;
    }
    result.push(line);
    i += 1;
  }

  return trimBody(result.join("\n"));
}

type PendingSectionMapping = {
  documentId: ChapterId;
  oldNumber: number;
  section: Section;
};

/**
 * Multiple Document bodies → flat Section list + serialized manuscript content.
 * Tracks old (documentId, sectionNumber) → new global number for meta remap.
 */
export function flattenChapterBodiesToSections(
  chapters: Chapter[],
  bodies: Map<ChapterId, string>,
): {
  sections: Section[];
  content: string;
  sectionNumberMap: SectionNumberMigrationMap;
} {
  const sorted = [...chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  const pending: PendingSectionMapping[] = [];
  const flat: Section[] = [];

  for (const chapter of sorted) {
    const rawBody = bodies.get(chapter.id) ?? "";
    const trimmed = trimBody(rawBody);

    if (!trimmed) continue;

    if (!chapterBodyHasSectionMarkers(rawBody)) {
      const title = chapter.title.trim() || defaultSectionTitle(flat.length + 1);
      flat.push({
        id: createStableSectionId(flat),
        number: 1,
        title,
        body: trimmed,
        startOffset: 0,
        endOffset: 0,
        charCount: countCharsWithoutSpaces(trimmed),
        status: "draft",
        memo: "",
        icons: { ...EMPTY_SECTION_ICONS },
      });
      pending.push({
        documentId: chapter.id,
        oldNumber: 1,
        section: flat[flat.length - 1],
      });
      continue;
    }

    const parsed = parseSections(rawBody);
    for (const section of parsed) {
      flat.push(section);
      pending.push({
        documentId: chapter.id,
        oldNumber: section.number,
        section,
      });
    }
  }

  const sections = remumberFlattenedSections(flat);
  const sectionNumberMap: SectionNumberMigrationMap = new Map();

  for (let i = 0; i < pending.length; i += 1) {
    const { documentId, oldNumber } = pending[i];
    sectionNumberMap.set(migrationMapKey(documentId, oldNumber), i + 1);
  }

  const serialized = serializeSections(sections);
  const content = stripChapterDelimiters(serialized);

  return { sections, content, sectionNumberMap };
}

/** Pure helper for unit tests — no storage I/O */
export function flattenBodiesToSectionContent(
  chapters: Chapter[],
  bodies: Map<ChapterId, string>,
): string {
  return flattenChapterBodiesToSections(chapters, bodies).content;
}

/**
 * Remap section metas from per-document numbers to global numbers on primary.
 * Status, memo, and collapsed state are preserved when a mapping exists.
 */
export async function remapSectionMetasForMigration(params: {
  projectId: ProjectId;
  primaryDocumentId: ChapterId;
  chapters: Chapter[];
  flattenedSections: Section[];
  sectionNumberMap: SectionNumberMigrationMap;
}): Promise<SectionMeta[]> {
  const {
    projectId,
    primaryDocumentId,
    chapters,
    flattenedSections,
    sectionNumberMap,
  } = params;

  const remappedByNumber = new Map<
    number,
    Pick<
      SectionMeta,
      "status" | "memo" | "icons" | "isCollapsed" | "id" | "createdAt"
    >
  >();

  for (const chapter of chapters) {
    const metas = await readSectionMetasByDocument(chapter.id);
    for (const meta of metas) {
      const newNumber = sectionNumberMap.get(
        migrationMapKey(chapter.id, meta.sectionNumber),
      );
      if (newNumber === undefined) continue;

      remappedByNumber.set(newNumber, {
        id: meta.id,
        status: meta.status,
        memo: meta.memo,
        icons: meta.icons ?? { ...EMPTY_SECTION_ICONS },
        isCollapsed: meta.isCollapsed,
        createdAt: meta.createdAt,
      });
    }
  }

  const collapsedNumbers = new Set<number>();
  const sectionsWithMeta: Section[] = flattenedSections.map((section) => {
    const remapped = remappedByNumber.get(section.number);
    if (remapped?.isCollapsed) {
      collapsedNumbers.add(section.number);
    }
    return {
      ...section,
      status: remapped?.status ?? section.status,
      memo: remapped?.memo ?? section.memo,
      icons: remapped?.icons ?? section.icons ?? { ...EMPTY_SECTION_ICONS },
    };
  });

  return saveSectionMetasForDocument({
    projectId,
    documentId: primaryDocumentId,
    sections: sectionsWithMeta,
    collapsedNumbers,
  });
}

function countNonEmptyDocuments(
  chapters: Chapter[],
  bodies: Map<ChapterId, string>,
): number {
  return chapters.filter((chapter) => trimBody(bodies.get(chapter.id) ?? "").length > 0)
    .length;
}

function projectNeedsSectionMigration(
  chapters: Chapter[],
  joinedContent: string,
  bodies: Map<ChapterId, string>,
): boolean {
  if (contentNeedsSectionMigration(joinedContent)) return true;
  return countNonEmptyDocuments(chapters, bodies) > 1;
}

/**
 * One-time (per project) migration: merge multi-document chapter bodies into
 * sections on the primary hidden manuscript document.
 */
export async function migrateProjectToSections(
  projectId: ProjectId,
): Promise<MigrateToSectionsResult> {
  const primary = await ensureManuscriptDocument(projectId);
  const chapters = await readChaptersByProject(projectId);
  const bodies = new Map<ChapterId, string>();

  await Promise.all(
    chapters.map(async (chapter) => {
      const manuscript = await getManuscriptByChapterId(projectId, chapter.id);
      bodies.set(chapter.id, manuscript?.content ?? "");
    }),
  );

  const joinedContent = joinChapterBodies(chapters, bodies);
  const alreadyMigrated = readMigratedProjectIds().includes(projectId);

  if (alreadyMigrated) {
    const primaryContent = bodies.get(primary.id) ?? "";
    if (!contentNeedsSectionMigration(primaryContent)) {
      const sections = parseSections(primaryContent);
      return {
        migrated: false,
        content: primaryContent,
        primaryDocumentId: primary.id,
        sectionCount: sections.length,
      };
    }
  }

  if (!projectNeedsSectionMigration(chapters, joinedContent, bodies)) {
    markProjectMigrated(projectId);
    const primaryContent = bodies.get(primary.id) ?? "";
    const sections = parseSections(primaryContent);
    return {
      migrated: false,
      content: primaryContent,
      primaryDocumentId: primary.id,
      sectionCount: sections.length,
    };
  }

  const { sections, content, sectionNumberMap } = flattenChapterBodiesToSections(
    chapters,
    bodies,
  );

  await remapSectionMetasForMigration({
    projectId,
    primaryDocumentId: primary.id,
    chapters,
    flattenedSections: sections,
    sectionNumberMap,
  });

  await saveManuscriptContent({
    projectId,
    chapterId: primary.id,
    content,
  });

  for (const chapter of chapters) {
    if (chapter.id === primary.id) continue;
    await saveManuscriptContent({
      projectId,
      chapterId: chapter.id,
      content: "",
    });
  }

  markProjectMigrated(projectId);

  return {
    migrated: true,
    content,
    primaryDocumentId: primary.id,
    sectionCount: sections.length,
  };
}
