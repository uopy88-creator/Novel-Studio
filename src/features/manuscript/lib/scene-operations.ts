/**
 * =============================================================================
 * Scene 조작 (추가 · 삭제 · 제목 · 순서)
 * -----------------------------------------------------------------------------
 * 모두 Scene[] → serialize → Manuscript content 갱신으로 이어진다.
 * =============================================================================
 */

import type { Scene, SceneDelimiterConfig } from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import {
  parseScenes,
  serializeScenes,
} from "@/features/manuscript/lib/scene-parser";

function remumber(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => ({
    ...scene,
    number: index + 1,
    id: `scene-${index + 1}-${scene.title}-${scene.body.slice(0, 16)}`.slice(
      0,
      80,
    ),
  }));
}

/** 드래그로 순서 변경 */
export function reorderScenes(
  scenes: Scene[],
  activeId: string,
  overId: string,
): Scene[] {
  const from = scenes.findIndex((s) => s.id === activeId);
  const to = scenes.findIndex((s) => s.id === overId);
  if (from < 0 || to < 0 || from === to) return scenes;

  const next = [...scenes];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return remumber(next);
}

/** 맨 끝(또는 afterIndex 다음)에 빈 Scene 추가 */
export function addScene(
  scenes: Scene[],
  afterIndex?: number,
): Scene[] {
  const blank: Scene = {
    id: `scene-new-${Date.now()}`,
    number: 0,
    title: "",
    body: "",
    startOffset: 0,
    endOffset: 0,
    charCount: 0,
    status: "draft",
    memo: "",
  };

  if (
    afterIndex === undefined ||
    afterIndex < 0 ||
    afterIndex >= scenes.length - 1
  ) {
    return remumber([...scenes, blank]);
  }

  const next = [...scenes];
  next.splice(afterIndex + 1, 0, blank);
  return remumber(next);
}

/** Scene 삭제 방식 */
export type SceneDeleteMode = "full" | "delimiter-only";

/**
 * Scene 삭제
 * - full: Scene 전체(구분자+본문) 제거
 * - delimiter-only: 구분자만 제거하고 본문은 인접 Scene에 병합
 * 최소 1개 Scene은 유지한다.
 */
export function deleteScene(
  scenes: Scene[],
  sceneId: string,
  mode: SceneDeleteMode = "full",
): Scene[] {
  if (scenes.length <= 1) return scenes;

  const index = scenes.findIndex((s) => s.id === sceneId);
  if (index < 0) return scenes;

  if (mode === "full") {
    return remumber(scenes.filter((s) => s.id !== sceneId));
  }

  // 구분자만 삭제 → 본문을 이전(없으면 다음) Scene에 붙인다
  const target = scenes[index];
  const body = target.body.replace(/^\n+/, "").replace(/\n+$/, "");
  const next = scenes.filter((_, i) => i !== index);

  if (body) {
    if (index > 0) {
      // 이전 Scene 끝에 병합
      const prevIndex = index - 1;
      const prev = next[prevIndex];
      const merged = [prev.body.replace(/\n+$/, ""), body]
        .filter(Boolean)
        .join("\n\n");
      next[prevIndex] = { ...prev, body: merged };
    } else if (next.length > 0) {
      // 첫 Scene이면 다음 Scene 앞에 병합
      const first = next[0];
      const merged = [body, first.body.replace(/^\n+/, "")]
        .filter(Boolean)
        .join("\n\n");
      next[0] = { ...first, body: merged };
    }
  }

  return remumber(next);
}

/** 제목만 수정 */
export function renameScene(
  scenes: Scene[],
  sceneId: string,
  title: string,
): Scene[] {
  return remumber(
    scenes.map((s) =>
      s.id === sceneId ? { ...s, title: title.trim() } : s,
    ),
  );
}

/** Scene[] 변경을 원고 문자열로 반영 */
export function applyScenesToContent(
  scenes: Scene[],
  config: SceneDelimiterConfig = DEFAULT_SCENE_DELIMITER,
): string {
  return serializeScenes(scenes, config);
}

/** content 기준으로 파싱 후 조작 결과를 다시 content 로 */
export function withParsedScenes(
  content: string,
  config: SceneDelimiterConfig,
  mutate: (scenes: Scene[]) => Scene[],
): string {
  const scenes = parseScenes(content, config);
  return applyScenesToContent(mutate(scenes), config);
}
