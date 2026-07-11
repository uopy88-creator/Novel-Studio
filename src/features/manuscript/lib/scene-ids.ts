/**
 * =============================================================================
 * Scene 안정 ID
 * -----------------------------------------------------------------------------
 * 사용자에게는 보이지 않는 내부 키 (예: scene_001).
 * 화면 표시 번호(1. 2. 3.)와 분리되어, 순서 변경 후에도 동일 Scene을 가리킨다.
 * =============================================================================
 */

import type { Scene } from "@/features/manuscript/types/scene";

const STABLE_ID_RE = /^scene_(\d+)$/;

/** `scene_001` 형식의 새 안정 ID를 발급한다. */
export function createStableSceneId(existing: Scene[]): string {
  let max = 0;
  for (const scene of existing) {
    const match = STABLE_ID_RE.exec(scene.id);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return formatStableSceneId(max + 1);
}

/** 1-based 순번 → scene_001 */
export function formatStableSceneId(ordinal: number): string {
  const n = Math.max(1, Math.floor(ordinal));
  return `scene_${String(n).padStart(3, "0")}`;
}

/** 이미 scene_NNN 이면 그대로, 아니면 순서 기반 ID 생성 */
export function ensureStableSceneId(
  candidate: string | undefined,
  fallbackOrdinal: number,
): string {
  if (candidate && STABLE_ID_RE.test(candidate)) return candidate;
  return formatStableSceneId(fallbackOrdinal);
}
