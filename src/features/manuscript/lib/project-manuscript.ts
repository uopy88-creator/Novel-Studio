/**
 * =============================================================================
 * 프로젝트 Manuscript 로드/저장
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (one hidden Document) → Sections
 *
 * UI 편집 대상은 primary Document 의 평탄한 Section 원고다.
 * 로드 시 ensure + Chapter→Section 마이그레이션을 수행한다.
 * (Migration 은 Section 구조 여부로만 판단 — LocalStorage 플래그 없음)
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
  await ensureManuscriptDocument(projectId);
  const migration = await migrateProjectToSections(projectId);

  const chapters = await readChaptersByProject(projectId);
  const primary =
    chapters.find((c) => c.id === migration.primaryDocumentId) ?? chapters[0];

  if (!primary) {
    return {
      chapters,
      content: migration.content,
      primaryDocumentId: migration.primaryDocumentId as ChapterId,
    };
  }

  const manuscript = await getManuscriptByChapterId(projectId, primary.id);

  // null = 행 없음 (새 프로젝트) → migration 결과 또는 ""
  // Manuscript 행이 있으면 content 사용 ("" 포함 = 실제 빈 원고)
  // 조회 실패는 getManuscriptByChapterId 가 throw
  let content: string;
  if (manuscript == null) {
    content = migration.content;
  } else {
    content = manuscript.content;
  }

  return {
    chapters,
    content,
    primaryDocumentId: primary.id,
  };
}

/**
 * 통합 원고를 primary Document manuscript 에만 저장한다.
 * 사용자 편집 경로이므로 빈 문자열(전체 삭제) 저장을 허용한다.
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
    // 사용자가 textarea 에서 전부 비운 경우만 빈 저장 허용
    allowEmptyOverwrite: true,
  });
  return { updatedAt: saved.updatedAt };
}
