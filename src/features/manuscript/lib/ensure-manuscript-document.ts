/**
 * =============================================================================
 * Hidden Manuscript Document — 프로젝트당 숨은 Document 1개
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (one hidden Document) → Sections (#N markers)
 *
 * Chapter UI is removed. We keep one Document row as a manuscript container
 * for FK compatibility (inspirations, section metas, etc.).
 *
 * 제품 구조: Project → Manuscript(숨은 Document 1개) → Section(#N 마커)
 * 챕터 UI는 제거되었고, FK 호환을 위해 Document 행 하나만 컨테이너로 유지한다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ProjectId } from "@/types/ids";
import {
  createChapter,
  readChaptersByProject,
} from "@/features/manuscript/lib/chapter-storage";

/** Primary manuscript container title — UI에 노출하지 않음 */
export const PRIMARY_MANUSCRIPT_TITLE = "Manuscript";

/**
 * 프로젝트의 숨은 Manuscript Document를 보장한다.
 * - 이미 Document가 있으면 sortOrder 최상위(첫 번째)를 반환
 * - 없으면 "Manuscript" Document를 생성해 반환
 *
 * Ensures the project has a hidden manuscript container document.
 */
export async function ensureManuscriptDocument(
  projectId: ProjectId,
): Promise<Chapter> {
  const chapters = await readChaptersByProject(projectId);
  if (chapters.length > 0) {
    return chapters[0];
  }

  return createChapter(projectId, {
    title: PRIMARY_MANUSCRIPT_TITLE,
    kind: "novel",
  });
}
