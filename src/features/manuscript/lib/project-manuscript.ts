/**
 * =============================================================================
 * 프로젝트 통합 Manuscript 로드/저장
 * -----------------------------------------------------------------------------
 * DB 는 Document별 manuscript 유지. UI 용으로 join / split.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId, ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import {
  getManuscriptByChapterId,
  saveManuscriptContent,
} from "@/features/manuscript/lib/manuscript-storage";
import {
  joinChapterBodies,
  splitChapterBodies,
} from "@/features/manuscript/lib/chapter-blocks";

export async function loadProjectManuscript(
  projectId: ProjectId,
): Promise<{ chapters: Chapter[]; content: string }> {
  const chapters = await readChaptersByProject(projectId);
  const bodies = new Map<ChapterId, string>();

  await Promise.all(
    chapters.map(async (chapter) => {
      const manuscript = await getManuscriptByChapterId(projectId, chapter.id);
      bodies.set(chapter.id, manuscript?.content ?? "");
    }),
  );

  return {
    chapters,
    content: joinChapterBodies(chapters, bodies),
  };
}

/** 통합 원고를 Document별 manuscript 로 나눠 저장 */
export async function saveProjectManuscript(params: {
  projectId: ProjectId;
  chapters: Chapter[];
  content: string;
}): Promise<{ updatedAt: string }> {
  const { projectId, chapters, content } = params;
  const bodies = splitChapterBodies(content, chapters);
  let latest = new Date(0).toISOString();

  for (const chapter of chapters) {
    const body = bodies.get(chapter.id) ?? "";
    const saved = await saveManuscriptContent({
      projectId,
      chapterId: chapter.id,
      content: body,
    });
    if (saved.updatedAt > latest) latest = saved.updatedAt;
  }

  return { updatedAt: latest };
}
