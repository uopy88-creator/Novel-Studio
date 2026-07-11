/**
 * =============================================================================
 * Scene 구분자 설정 (LocalStorage)
 * -----------------------------------------------------------------------------
 * 지금은 Manuscript 전용 키로 읽고 씁니다.
 * 이후 Settings 페이지에서 같은 함수를 호출하면 됩니다.
 * =============================================================================
 */

import type { SceneDelimiterConfig } from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import {
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";
import { SCENE_DELIMITER_SETTINGS_KEY } from "@/lib/storage/keys";

export { SCENE_DELIMITER_SETTINGS_KEY };
export function readSceneDelimiterConfig(): SceneDelimiterConfig {
  const raw = readStorageString(SCENE_DELIMITER_SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SCENE_DELIMITER };

  try {
    const parsed = JSON.parse(raw) as Partial<SceneDelimiterConfig>;
    const prefix =
      typeof parsed.prefix === "string" && parsed.prefix.length > 0
        ? parsed.prefix
        : DEFAULT_SCENE_DELIMITER.prefix;
    return { prefix };
  } catch {
    return { ...DEFAULT_SCENE_DELIMITER };
  }
}

export function writeSceneDelimiterConfig(
  config: SceneDelimiterConfig,
): void {
  writeStorageString(
    SCENE_DELIMITER_SETTINGS_KEY,
    JSON.stringify({
      prefix: config.prefix || DEFAULT_SCENE_DELIMITER.prefix,
    }),
  );
}

/**
 * `#1`, `#2 제목` 형태를 찾는 정규식.
 * prefix 에 정규식 특수문자가 있어도 안전하게 escape 한다.
 */
export function buildSceneMarkerRegex(config: SceneDelimiterConfig): RegExp {
  const escaped = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 줄 시작 + prefix + 숫자 + (선택) 공백과 제목
  return new RegExp(`^${escaped}(\\d+)(?:[ \\t]+(.*))?$`);
}
