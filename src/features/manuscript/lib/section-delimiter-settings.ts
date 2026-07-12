/**
 * =============================================================================
 * Section 구분자 설정 (LocalStorage)
 * -----------------------------------------------------------------------------
 * 키는 하위 호환을 위해 기존 scene-delimiter-settings 를 유지한다.
 * =============================================================================
 */

import type { SectionDelimiterConfig } from "@/features/manuscript/types/section";
import { DEFAULT_SECTION_DELIMITER } from "@/features/manuscript/types/section";
import {
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";
import { SECTION_DELIMITER_SETTINGS_KEY } from "@/lib/storage/keys";

export { SECTION_DELIMITER_SETTINGS_KEY };

export function readSectionDelimiterConfig(): SectionDelimiterConfig {
  const raw = readStorageString(SECTION_DELIMITER_SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SECTION_DELIMITER };

  try {
    const parsed = JSON.parse(raw) as Partial<SectionDelimiterConfig>;
    const prefix =
      typeof parsed.prefix === "string" && parsed.prefix.length > 0
        ? parsed.prefix
        : DEFAULT_SECTION_DELIMITER.prefix;
    return { prefix };
  } catch {
    return { ...DEFAULT_SECTION_DELIMITER };
  }
}

export function writeSectionDelimiterConfig(
  config: SectionDelimiterConfig,
): void {
  writeStorageString(
    SECTION_DELIMITER_SETTINGS_KEY,
    JSON.stringify({
      prefix: config.prefix || DEFAULT_SECTION_DELIMITER.prefix,
    }),
  );
}

/**
 * `#1`, `#2 제목` 형태를 찾는 정규식.
 * prefix 에 정규식 특수문자가 있어도 안전하게 escape 한다.
 */
export function buildSectionMarkerRegex(
  config: SectionDelimiterConfig,
): RegExp {
  const escaped = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\d+)(?:[ \\t]+(.*))?$`);
}

/** @deprecated Use readSectionDelimiterConfig */
export const readSceneDelimiterConfig = readSectionDelimiterConfig;
/** @deprecated Use writeSectionDelimiterConfig */
export const writeSceneDelimiterConfig = writeSectionDelimiterConfig;
/** @deprecated Use buildSectionMarkerRegex */
export const buildSceneMarkerRegex = buildSectionMarkerRegex;
