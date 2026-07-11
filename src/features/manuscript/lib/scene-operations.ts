/**
 * =============================================================================
 * Scene 조작 (추가 · 삭제 · 제목 · 순서)
 * -----------------------------------------------------------------------------
 * 모두 Scene[] → serialize → Manuscript content 갱신으로 이어진다.
 * 번호는 항상 배열 순서로 자동 재계산한다. 사용자는 번호를 수정하지 않는다.
 * 안정 ID(id)는 순서 변경·제목 변경 시에도 유지한다.
 * =============================================================================
 */

import type { Scene, SceneDelimiterConfig } from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import {
  parseScenes,
  serializeScenes,
} from "@/features/manuscript/lib/scene-parser";
import { createStableSceneId } from "@/features/manuscript/lib/scene-ids";
import { countCharsWithoutSpaces } from "@/lib/stats";

/** 표시 번호만 다시 매긴다. 안정 ID(id)는 보존. */
function remumber(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => ({
    ...scene,
    number: index + 1,
    charCount: countCharsWithoutSpaces(scene.body),
  }));
}

/** 드래그로 순서 변경 → Manuscript 본문도 같은 순서로 재배열 */
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

/**
 * 맨 끝(또는 afterIndex 다음)에 빈 Scene 추가.
 * 제목 입력란(빈 title) + 빈 본문. 상태는 초안.
 */
export function addScene(
  scenes: Scene[],
  afterIndex?: number,
): Scene[] {
  const blank: Scene = {
    id: createStableSceneId(scenes),
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
 * - delimiter-only: Scene 구분만 제거하고 본문은 인접 Scene에 병합
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

  // 구분만 삭제 → 본문을 이전(없으면 다음) Scene에 붙인다
  const target = scenes[index];
  const body = target.body.replace(/^\n+/, "").replace(/\n+$/, "");
  const next = scenes.filter((_, i) => i !== index);

  if (body) {
    if (index > 0) {
      const prevIndex = index - 1;
      const prev = next[prevIndex];
      const merged = [prev.body.replace(/\n+$/, ""), body]
        .filter(Boolean)
        .join("\n\n");
      next[prevIndex] = {
        ...prev,
        body: merged,
        charCount: countCharsWithoutSpaces(merged),
      };
    } else if (next.length > 0) {
      const first = next[0];
      const merged = [body, first.body.replace(/^\n+/, "")]
        .filter(Boolean)
        .join("\n\n");
      next[0] = {
        ...first,
        body: merged,
        charCount: countCharsWithoutSpaces(merged),
      };
    }
  }

  return remumber(next);
}

/** 제목만 수정 (번호·본문·안정 ID 유지) */
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
