/**
 * =============================================================================
 * Section 안정 ID
 * -----------------------------------------------------------------------------
 * 사용자에게는 보이지 않는 내부 키.
 * - 신규: `section_001`
 * - 레거시: `scene_001` (기존 원고 태그 — 파서·ensure 가 수용)
 * 화면 표시 번호(1. 2. 3.)와 분리되어, 순서 변경 후에도 동일 Section을 가리킨다.
 * =============================================================================
 */

import type { Section } from "@/features/manuscript/types/section";

const SECTION_ID_RE = /^section_(\d+)$/;
const SCENE_ID_RE = /^scene_(\d+)$/;
const STABLE_ID_RE = /^(?:section|scene)_(\d+)$/;

/** `section_001` 형식의 새 안정 ID를 발급한다. */
export function createStableSectionId(existing: Section[]): string {
  let max = 0;
  for (const section of existing) {
    const match = STABLE_ID_RE.exec(section.id);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return formatStableSectionId(max + 1);
}

/** 1-based 순번 → section_001 */
export function formatStableSectionId(ordinal: number): string {
  const n = Math.max(1, Math.floor(ordinal));
  return `section_${String(n).padStart(3, "0")}`;
}

/**
 * 이미 section_NNN 또는 레거시 scene_NNN 이면 그대로,
 * 아니면 순서 기반 section_NNN 생성.
 */
export function ensureStableSectionId(
  candidate: string | undefined,
  fallbackOrdinal: number,
): string {
  if (candidate && STABLE_ID_RE.test(candidate)) return candidate;
  return formatStableSectionId(fallbackOrdinal);
}

export function isLegacySceneStableId(id: string): boolean {
  return SCENE_ID_RE.test(id);
}

export function isSectionStableId(id: string): boolean {
  return SECTION_ID_RE.test(id) || SCENE_ID_RE.test(id);
}

/** @deprecated Use createStableSectionId */
export const createStableSceneId = createStableSectionId;
/** @deprecated Use formatStableSectionId */
export const formatStableSceneId = formatStableSectionId;
/** @deprecated Use ensureStableSectionId */
export const ensureStableSceneId = ensureStableSectionId;
