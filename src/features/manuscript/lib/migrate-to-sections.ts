/**
 * =============================================================================
 * Chapter → Section 마이그레이션 (데이터 안정성)
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (one hidden Document) → Sections (#N markers)
 *
 * 규칙:
 * 1. LocalStorage 마이그레이션 플래그 사용 금지 — Section 구조 여부로만 판단
 * 2. 이미 Section 구조인 프로젝트는 절대 다시 flatten 하지 않음
 * 3. null(조회 실패/행 없음) 과 ""(빈 원고) 를 혼동하지 않음
 * 4. Primary 저장 → 검증 → Meta 저장 → 성공 시에만 secondary 비우기
 * 5. 중간 실패 시 secondary Document 내용은 그대로 유지 (부분 파괴 방지)
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

/** Document 본문: 행이 있으면 string(빈 원고 포함), 행이 없으면 null */
type DocumentBodyState = string | null;

function migrationMapKey(documentId: ChapterId, sectionNumber: number): string {
  return `${documentId}:${sectionNumber}`;
}

function migrationLog(
  level: "info" | "warn" | "error",
  stage: string,
  payload: Record<string, unknown>,
): void {
  const prefix = `[migrate-to-sections:${stage}]`;
  if (level === "error") {
    console.error(prefix, payload);
  } else if (level === "warn") {
    console.warn(prefix, payload);
  } else {
    console.info(prefix, payload);
  }
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
export function chapterBodyHasSectionMarkers(body: string): boolean {
  const trimmed = trimBody(body);
  if (!trimmed) return false;
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

/**
 * Primary 원고가 이미 Section 구조이면 true.
 * (챕터 구분선 없음 + #N 마커 존재)
 * → 이 경우 flatten 을 절대 다시 실행하지 않는다.
 */
export function isAlreadySectionStructure(content: string): boolean {
  if (!content || !trimBody(content)) return false;
  if (contentNeedsSectionMigration(content)) return false;
  return chapterBodyHasSectionMarkers(content);
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
 *
 * bodies 값:
 * - string: 원고 행 존재 ("" = 실제 빈 원고)
 * - null 은 이 함수에 넣지 않는다 (호출 측에서 스킵)
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
    if (!bodies.has(chapter.id)) continue;
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

function countNonEmptyDocumentBodies(
  chapters: Chapter[],
  bodies: Map<ChapterId, DocumentBodyState>,
): number {
  return chapters.filter((chapter) => {
    const body = bodies.get(chapter.id);
    // null = 행 없음 → 비어 있지 않은 원고로 세지 않음
    if (body == null) return false;
    return trimBody(body).length > 0;
  }).length;
}

/**
 * Migration 이 필요한지 Section/챕터 구조로만 판단한다.
 * LocalStorage 플래그는 사용하지 않는다.
 */
export function projectNeedsSectionMigration(
  chapters: Chapter[],
  joinedContent: string,
  bodies: Map<ChapterId, DocumentBodyState>,
  primaryDocumentId: ChapterId,
): boolean {
  const primaryBody = bodies.get(primaryDocumentId);

  // Primary 가 이미 Section 구조면 flatten 금지
  // (secondary 잔여본이 있어도 재병합하면 내용이 중복될 수 있음)
  if (primaryBody != null && isAlreadySectionStructure(primaryBody)) {
    return false;
  }

  if (contentNeedsSectionMigration(joinedContent)) return true;
  return countNonEmptyDocumentBodies(chapters, bodies) > 1;
}

/**
 * Document 별 원고를 로드한다.
 * - manuscript 행 있음 → content ("" 가능)
 * - manuscript 행 없음 → null (빈 문자열로 치환하지 않음)
 * - DB/네트워크 오류 → throw (상위에서 Migration 중단)
 */
async function loadDocumentBodies(
  projectId: ProjectId,
  chapters: Chapter[],
): Promise<Map<ChapterId, DocumentBodyState>> {
  const bodies = new Map<ChapterId, DocumentBodyState>();

  await Promise.all(
    chapters.map(async (chapter) => {
      const manuscript = await getManuscriptByChapterId(projectId, chapter.id);
      if (manuscript == null) {
        bodies.set(chapter.id, null);
        return;
      }
      // content 는 string — "" 는 실제 빈 원고
      bodies.set(chapter.id, manuscript.content);
    }),
  );

  return bodies;
}

/** flatten 용: null(행 없음) Document 는 Map 에서 제외 */
function bodiesForFlatten(
  bodies: Map<ChapterId, DocumentBodyState>,
): Map<ChapterId, string> {
  const out = new Map<ChapterId, string>();
  for (const [id, body] of bodies) {
    if (body == null) continue;
    out.set(id, body);
  }
  return out;
}

/** joinChapterBodies 호환: null → 합칠 때 스킵되도록 "" 가 아니라 미포함 처리 */
function bodiesForJoin(
  bodies: Map<ChapterId, DocumentBodyState>,
): Map<ChapterId, string> {
  const out = new Map<ChapterId, string>();
  for (const [id, body] of bodies) {
    // join 은 레거시 구분선 검출용 — 행 없음은 빈 것으로 취급하되,
    // migration 판단의 "비어 있지 않음" 카운트와는 분리되어 있다.
    out.set(id, body ?? "");
  }
  return out;
}

/**
 * One-time structural migration: merge multi-document chapter bodies into
 * sections on the primary hidden manuscript document.
 *
 * 트랜잭션형:
 * ① Primary 저장 성공
 * ② 저장 검증 성공 (saveManuscriptContent 내부)
 * ③ Section Meta 저장 성공
 * ④ 그 이후에만 secondary Document 비우기
 *
 * 중간 실패 시 secondary 는 건드리지 않는다.
 */
export async function migrateProjectToSections(
  projectId: ProjectId,
): Promise<MigrateToSectionsResult> {
  const stage = { current: "init" };

  try {
    stage.current = "ensure-primary";
    const primary = await ensureManuscriptDocument(projectId);

    stage.current = "read-chapters";
    const chapters = await readChaptersByProject(projectId);

    stage.current = "load-bodies";
    const bodies = await loadDocumentBodies(projectId, chapters);

    const joinBodies = bodiesForJoin(bodies);
    const joinedContent = joinChapterBodies(chapters, joinBodies);
    const primaryBody = bodies.get(primary.id);
    const primaryContent = primaryBody ?? "";
    const documentCount = chapters.length;
    const nonEmptyCount = countNonEmptyDocumentBodies(chapters, bodies);

    migrationLog("info", "start", {
      projectId,
      documentCount,
      nonEmptyDocuments: nonEmptyCount,
      primaryDocumentId: primary.id,
      primaryLength: primaryBody == null ? null : primaryBody.length,
      primaryMissingRow: primaryBody == null,
    });

    // 이미 Section 구조 → flatten 금지. secondary 잔여만 안전하게 정리 시도.
    if (primaryBody != null && isAlreadySectionStructure(primaryBody)) {
      stage.current = "already-section-structure";
      const sections = parseSections(primaryBody);
      migrationLog("info", "skip-already-sections", {
        projectId,
        migrated: false,
        sectionCount: sections.length,
        contentLength: primaryBody.length,
      });

      // Primary 검증된 Section 원고가 있을 때만 leftover secondary 비우기
      if (nonEmptyCount > 1 && trimBody(primaryBody).length > 0) {
        stage.current = "cleanup-secondary-leftovers";
        try {
          await clearSecondaryDocumentsAfterSuccess({
            projectId,
            chapters,
            primaryId: primary.id,
            bodies,
          });
        } catch (clearError) {
          migrationLog("warn", "cleanup-leftovers-partial", {
            projectId,
            error:
              clearError instanceof Error
                ? clearError.message
                : String(clearError),
          });
        }
      }

      return {
        migrated: false,
        content: primaryBody,
        primaryDocumentId: primary.id,
        sectionCount: sections.length,
      };
    }

    if (!projectNeedsSectionMigration(chapters, joinedContent, bodies, primary.id)) {
      stage.current = "no-migration-needed";
      const sections = parseSections(primaryContent);
      migrationLog("info", "skip-not-needed", {
        projectId,
        migrated: false,
        sectionCount: sections.length,
        contentLength: primaryContent.length,
      });
      return {
        migrated: false,
        content: primaryContent,
        primaryDocumentId: primary.id,
        sectionCount: sections.length,
      };
    }

    // --- 실제 Migration ---
    stage.current = "flatten";
    const { sections, content, sectionNumberMap } =
      flattenChapterBodiesToSections(chapters, bodiesForFlatten(bodies));

    // 병합 결과가 비었는데 원본에 내용이 있으면 중단 (빈 원고 저장 금지)
    const hadSourceContent = nonEmptyCount > 0;
    if (hadSourceContent && trimBody(content).length === 0) {
      throw new Error(
        "[migrate-to-sections] refuse to save empty merged content while source documents had text",
      );
    }

    migrationLog("info", "flattened", {
      projectId,
      sectionCount: sections.length,
      contentLength: content.length,
    });

    // ① + ② Primary 저장 + 검증
    stage.current = "save-primary";
    await saveManuscriptContent({
      projectId,
      chapterId: primary.id,
      content,
      // Migration 은 빈 primary 를 의도적으로 쓰지 않는다
      allowEmptyOverwrite: false,
    });

    migrationLog("info", "primary-saved", {
      projectId,
      primaryDocumentId: primary.id,
      contentLength: content.length,
      saveSuccess: true,
    });

    // ③ Section Meta 저장 (실패 시 secondary 비우지 않음)
    stage.current = "save-section-metas";
    await remapSectionMetasForMigration({
      projectId,
      primaryDocumentId: primary.id,
      chapters,
      flattenedSections: sections,
      sectionNumberMap,
    });

    migrationLog("info", "metas-saved", {
      projectId,
      sectionCount: sections.length,
    });

    // ④ 성공 후에만 secondary 비우기
    // clear 실패해도 primary·meta 는 이미 확정 — 다음 로드에서 leftover cleanup 재시도
    stage.current = "clear-secondaries";
    try {
      await clearSecondaryDocumentsAfterSuccess({
        projectId,
        chapters,
        primaryId: primary.id,
        bodies,
      });
    } catch (clearError) {
      migrationLog("warn", "clear-secondaries-partial", {
        projectId,
        error:
          clearError instanceof Error
            ? clearError.message
            : String(clearError),
      });
    }
    migrationLog("info", "complete", {
      projectId,
      documentCount,
      sectionCount: sections.length,
      migrated: true,
      contentLength: content.length,
      saveSuccess: true,
    });

    return {
      migrated: true,
      content,
      primaryDocumentId: primary.id,
      sectionCount: sections.length,
    };
  } catch (error) {
    migrationLog("error", "failed", {
      projectId,
      stage: stage.current,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Primary 저장·검증·메타까지 끝난 뒤에만 secondary 를 비운다.
 * allowEmptyOverwrite=true 는 이 cleanup 경로에서만 사용한다.
 */
async function clearSecondaryDocumentsAfterSuccess(params: {
  projectId: ProjectId;
  chapters: Chapter[];
  primaryId: ChapterId;
  bodies: Map<ChapterId, DocumentBodyState>;
}): Promise<void> {
  const { projectId, chapters, primaryId, bodies } = params;

  for (const chapter of chapters) {
    if (chapter.id === primaryId) continue;

    const body = bodies.get(chapter.id);
    // 행이 없거나 이미 비어 있으면 스킵
    if (body == null) continue;
    if (trimBody(body).length === 0) continue;

    await saveManuscriptContent({
      projectId,
      chapterId: chapter.id,
      content: "",
      allowEmptyOverwrite: true,
    });
  }
}
