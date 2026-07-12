/**
 * =============================================================================
 * Export 본문 조립
 * -----------------------------------------------------------------------------
 * Manuscript / Section / Project 범위와 옵션에 따라 텍스트 페이로드를 만든다.
 * 포맷(TXT·DOCX·PDF) 생성기는 이 페이로드만 소비한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Section } from "@/features/manuscript/types/section";
import { DEFAULT_SECTION_DELIMITER } from "@/features/manuscript/types/section";
import {
  parseSections,
} from "@/features/manuscript/lib/section-parser";
import {
  mergeSectionsWithMetas,
  readSectionMetasByDocument,
} from "@/features/manuscript/lib/section-meta-storage";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import { getManuscriptByChapterId } from "@/features/manuscript/lib/manuscript-storage";
import { readManuscriptsByProject } from "@/features/dashboard/lib/dashboard-data";
import { getProjectById } from "@/features/projects/lib/project-storage";
import { readDialoguesByProject } from "@/features/dialogue-vault/lib/dialogue-storage";
import {
  readInspirationsByDocument,
  readInspirationsByProject,
} from "@/features/inspiration/lib/inspiration-storage";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { WritingVaultEntry } from "@/features/dialogue-vault/types/dialogue";
import {
  WRITING_VAULT_TYPE_LABELS,
} from "@/features/dialogue-vault/types/dialogue";
import type {
  ExportDocumentBlock,
  ExportOptions,
  ExportPayload,
  ExportScope,
} from "@/features/export/types/export-options";
import type { ChapterId, ProjectId } from "@/types/ids";
import { stripManuscriptMarkup } from "@/features/manuscript/lib/manuscript-markup";

export interface BuildExportInput {
  projectId: ProjectId;
  /** manuscript / scenes 범위일 때 현재 Document */
  chapterId: ChapterId | null;
  scope: ExportScope;
  /** scope === "scenes" 일 때 선택된 Section id */
  selectedSceneIds: string[];
  /** 에디터에 열린 최신 원고 (저장 전 dirty 반영) */
  liveContent?: string;
  options: ExportOptions;
}

function sectionHeader(section: Section, includeDelimiter: boolean): string {
  if (!includeDelimiter) return "";
  const title = section.title.trim();
  return title
    ? `${DEFAULT_SECTION_DELIMITER.prefix}${section.number} ${title}`
    : `${DEFAULT_SECTION_DELIMITER.prefix}${section.number}`;
}

/**
 * Section[] → 옵션이 반영된 본문 문자열
 */
function renderSectionsText(
  sections: Section[],
  options: ExportOptions,
): string {
  const parts: string[] = [];

  for (const section of sections) {
    const chunks: string[] = [];
    const header = sectionHeader(section, options.includeSceneDelimiters);
    if (header) chunks.push(header);

    const body = section.body.replace(/^\n+/, "").replace(/\n+$/, "");
    if (body) chunks.push(body);

    if (!options.excludeSceneMemos && section.memo.trim()) {
      chunks.push(`[Section 메모] ${section.memo.trim()}`);
    }

    if (chunks.length > 0) {
      parts.push(chunks.join("\n"));
    }
  }

  return parts.join("\n\n");
}

async function loadSectionsForDocument(
  chapterId: ChapterId,
  content: string,
  options: ExportOptions,
): Promise<Section[]> {
  const parsed = parseSections(content);
  if (options.excludeSceneMemos) {
    return parsed;
  }
  const metas = await readSectionMetasByDocument(chapterId);
  return mergeSectionsWithMetas(parsed, metas);
}

function formatInspirations(
  items: Inspiration[],
  documentTitle?: string,
): string {
  if (items.length === 0) return "";
  const lines: string[] = ["—— Inspiration ——"];
  if (documentTitle) {
    lines.push(`Document: ${documentTitle}`);
  }
  for (const item of items) {
    lines.push("");
    lines.push(`「${item.selectedText}」`);
    if (item.workTitle.trim()) {
      lines.push(
        `참고: ${item.workTitle}${item.author.trim() ? ` / ${item.author}` : ""}`,
      );
    }
    if (item.memo.trim()) {
      lines.push(`메모: ${item.memo.trim()}`);
    }
  }
  return lines.join("\n");
}

function formatWritingVault(entries: WritingVaultEntry[]): string {
  if (entries.length === 0) return "";
  const lines: string[] = ["—— Writing Vault ——"];
  for (const entry of entries) {
    lines.push("");
    const typeLabel = WRITING_VAULT_TYPE_LABELS[entry.type] ?? entry.type;
    const title = entry.title.trim();
    lines.push(title ? `[${typeLabel}] ${title}` : `[${typeLabel}]`);
    lines.push(entry.content);
    const ref = entry.reference;
    if (ref.workTitle.trim() || ref.author.trim() || ref.memo.trim()) {
      const bits = [
        ref.workTitle.trim(),
        ref.author.trim(),
        ref.memo.trim(),
      ].filter(Boolean);
      lines.push(`참고: ${bits.join(" / ")}`);
    }
  }
  return lines.join("\n");
}

async function buildAppendix(
  projectId: ProjectId,
  chapterIds: ChapterId[],
  documents: Chapter[],
  options: ExportOptions,
): Promise<string> {
  const sections: string[] = [];

  if (!options.excludeWritingVault) {
    const vault = await readDialoguesByProject(projectId);
    const text = formatWritingVault(vault);
    if (text) sections.push(text);
  }

  if (options.includeInspirationNotes) {
    if (chapterIds.length === 1) {
      const doc = documents.find((d) => d.id === chapterIds[0]);
      const items = await readInspirationsByDocument(
        projectId,
        chapterIds[0],
      );
      const text = formatInspirations(items, doc?.title);
      if (text) sections.push(text);
    } else {
      const all = await readInspirationsByProject(projectId);
      const byDoc = new Map<string, Inspiration[]>();
      for (const item of all) {
        if (!chapterIds.includes(item.documentId as ChapterId)) continue;
        const list = byDoc.get(item.documentId) ?? [];
        list.push(item);
        byDoc.set(item.documentId, list);
      }
      for (const [docId, items] of byDoc) {
        const doc = documents.find((d) => d.id === docId);
        const text = formatInspirations(items, doc?.title);
        if (text) sections.push(text);
      }
    }
  }

  return sections.join("\n\n");
}

/**
 * Export 범위·옵션에 맞는 페이로드를 비동기로 조립한다.
 */
export async function buildExportPayload(
  input: BuildExportInput,
): Promise<ExportPayload> {
  const { projectId, chapterId, scope, selectedSceneIds, liveContent, options } =
    input;

  const project = await getProjectById(projectId);
  const projectTitle = project?.title?.trim() || "Untitled";
  const allDocuments = await readChaptersByProject(projectId);
  const generatedAt = new Date().toISOString();

  if (scope === "project") {
    const manuscripts = await readManuscriptsByProject(projectId);
    const byChapter = new Map<string, Manuscript>();
    for (const m of manuscripts) {
      byChapter.set(m.chapterId, m);
    }

    const documents: ExportDocumentBlock[] = [];
    for (const doc of allDocuments) {
      const manuscript = byChapter.get(doc.id);
      const content = manuscript?.content ?? "";
      const sections = await loadSectionsForDocument(
        doc.id,
        content,
        options,
      );
      documents.push({
        title: doc.title,
        body: renderSectionsText(sections, options),
      });
    }

    const appendix = await buildAppendix(
      projectId,
      allDocuments.map((d) => d.id),
      allDocuments,
      options,
    );

    return {
      title: projectTitle,
      projectTitle,
      documents,
      appendix,
      options,
      generatedAt,
    };
  }

  if (!chapterId) {
    throw new Error("Document를 선택한 뒤 Export 할 수 있습니다.");
  }

  const currentDoc =
    allDocuments.find((d) => d.id === chapterId) ?? null;
  const docTitle = currentDoc?.title?.trim() || "Manuscript";

  let content = liveContent;
  if (content === undefined) {
    const manuscript = await getManuscriptByChapterId(projectId, chapterId);
    content = manuscript?.content ?? "";
  }

  let sections = await loadSectionsForDocument(
    chapterId,
    content,
    options,
  );

  if (scope === "scenes") {
    if (selectedSceneIds.length === 0) {
      throw new Error("내보낼 Section을 하나 이상 선택하세요.");
    }
    const selected = new Set(selectedSceneIds);
    sections = sections.filter((s) => selected.has(s.id));
    if (sections.length === 0) {
      throw new Error("선택한 Section을 찾을 수 없습니다.");
    }
  }

  const body = renderSectionsText(sections, options);
  const appendix = await buildAppendix(
    projectId,
    [chapterId],
    allDocuments,
    options,
  );

  return {
    title: scope === "scenes" ? `${docTitle} (Sections)` : docTitle,
    projectTitle,
    documents: [{ title: docTitle, body }],
    appendix,
    options,
    generatedAt,
  };
}

/**
 * 페이로드를 하나의 연속 텍스트로 (TXT / 간단 미리보기용)
 * 색상 마커는 제거한다.
 */
export function payloadToPlainText(payload: ExportPayload): string {
  const chunks: string[] = [];

  if (payload.projectTitle) {
    chunks.push(payload.projectTitle);
    chunks.push("");
  }

  for (let i = 0; i < payload.documents.length; i += 1) {
    const doc = payload.documents[i];
    if (payload.documents.length > 1) {
      chunks.push(`【${doc.title}】`);
      chunks.push("");
    }
    if (doc.body.trim()) {
      chunks.push(doc.body.trim());
    }
    if (i < payload.documents.length - 1) {
      chunks.push("");
      chunks.push("————————");
      chunks.push("");
    }
  }

  if (payload.appendix.trim()) {
    chunks.push("");
    chunks.push(payload.appendix.trim());
  }

  const joined =
    chunks.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  // TXT 는 색상 정보를 넣지 않는다
  return stripManuscriptMarkup(joined);
}
