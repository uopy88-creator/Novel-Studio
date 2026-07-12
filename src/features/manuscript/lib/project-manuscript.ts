/**
 * =============================================================================
 * 프로젝트 Manuscript 로드/저장
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (one hidden Document) → Sections
 *
 * UI 편집 대상은 primary Document 의 평탄한 Section 원고다.
 * 로드 시 ensure + Chapter→Section 마이그레이션을 한 번 수행한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import {
  getManuscriptByChapterId,
  saveManuscriptContent,
} from "@/features/manuscript/lib/manuscript-storage";
import { ensureManuscriptDocument } from "@/features/manuscript/lib/ensure-manuscript-document";
import { migrateProjectToSections } from "@/features/manuscript/lib/migrate-to-sections";

export async function loadProjectManuscript(
  projectId: ProjectId,
): Promise<{
  chapters: Chapter[];
  content: string;
  primaryDocumentId: ChapterId;
}> {
  // 숨은 Manuscript Document 보장 + Chapter 블록 → Section 통합
  await ensureManuscriptDocument(projectId);
  const migration = await migrateProjectToSections(projectId);

  const chapters = await readChaptersByProject(projectId);
  const primary =
    chapters.find((c) => c.id === migration.primaryDocumentId) ?? chapters[0];

  const manuscript = primary
    ? await getManuscriptByChapterId(projectId, primary.id)
    : null;

  return {
    chapters,
    content: manuscript?.content ?? migration.content ?? "",
    primaryDocumentId: (primary?.id ?? migration.primaryDocumentId) as ChapterId,
  };
}

/**
 * 통합 원고를 primary Document manuscript 에만 저장한다.
 * (다른 Document 행은 FK 호환용으로 비운 채 유지)
 */
export async function saveProjectManuscript(params: {
  projectId: ProjectId;
  chapters: Chapter[];
  content: string;
  primaryDocumentId?: ChapterId;
}): Promise<{ updatedAt: string }> {
  const { projectId, chapters, content, primaryDocumentId } = params;
  const primaryId = primaryDocumentId ?? chapters[0]?.id;
  if (!primaryId) {
    return { updatedAt: new Date().toISOString() };
  }

  const saved = await saveManuscriptContent({
    projectId,
    chapterId: primaryId,
    content,
  });
  return { updatedAt: saved.updatedAt };
}
