/**
 * =============================================================================
 * Timeline ↔ Scene 옵션
 * -----------------------------------------------------------------------------
 * 프로젝트의 모든 Document에서 Scene 을 모아 선택 목록으로 만든다.
 * Scene Navigator 와 같은 parseScenes / 안정 ID 를 사용한다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import { readAllManuscripts } from "@/features/manuscript/lib/manuscript-storage";
import { parseScenes } from "@/features/manuscript/lib/scene-parser";

export interface TimelineSceneOption {
  /** select value — `${documentId}::${sceneStableId}` */
  value: string;
  documentId: string;
  documentTitle: string;
  sceneStableId: string;
  sceneNumber: number;
  sceneTitle: string;
  label: string;
}

export function encodeSceneOptionValue(
  documentId: string,
  sceneStableId: string,
): string {
  return `${documentId}::${sceneStableId}`;
}

export function decodeSceneOptionValue(
  value: string,
): { documentId: string; sceneStableId: string } | null {
  const sep = value.indexOf("::");
  if (sep <= 0) return null;
  const documentId = value.slice(0, sep);
  const sceneStableId = value.slice(sep + 2);
  if (!documentId || !sceneStableId) return null;
  return { documentId, sceneStableId };
}

/** 프로젝트 내 Scene 선택지 (Document · 번호 · 제목) */
export async function loadTimelineSceneOptions(
  projectId: ProjectId,
): Promise<TimelineSceneOption[]> {
  const [chapters, manuscripts] = await Promise.all([
    readChaptersByProject(projectId),
    readAllManuscripts(),
  ]);

  const titleById = new Map(
    chapters.map((c) => [c.id, c.title.trim() || "제목 없는 Document"]),
  );
  const options: TimelineSceneOption[] = [];

  for (const manuscript of manuscripts) {
    if (manuscript.projectId !== projectId) continue;
    const documentTitle =
      titleById.get(manuscript.chapterId) ?? "Document";
    const scenes = parseScenes(manuscript.content ?? "");
    for (const scene of scenes) {
      const sceneTitle = scene.title.trim() || "제목 없음";
      options.push({
        value: encodeSceneOptionValue(manuscript.chapterId, scene.id),
        documentId: manuscript.chapterId,
        documentTitle,
        sceneStableId: scene.id,
        sceneNumber: scene.number,
        sceneTitle,
        label: `${documentTitle} · ${scene.number}. ${sceneTitle}`,
      });
    }
  }

  return options;
}
