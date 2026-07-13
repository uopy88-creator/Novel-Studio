/**
 * =============================================================================
 * Synonym DB — 카테고리 JSON 통합 인덱스
 * -----------------------------------------------------------------------------
 * 새 카테고리 파일(*.json)을 추가한 뒤, 아래 import 와 SYNONYM_CATALOGS 에
 * 한 줄만 넣으면 검색 대상에 포함된다.
 *
 * 규칙 (로더에서 강제):
 * - 단어당 유의어 최대 5개
 * - 가나다순 정렬
 * =============================================================================
 */

import emotion from "./emotion.json";
import action from "./action.json";
import movement from "./movement.json";
import speech from "./speech.json";
import appearance from "./appearance.json";
import nature from "./nature.json";
import time from "./time.json";
import gaze from "./gaze.json";

/** 카테고리 파일 한 개 = Record<headword, synonyms[]> */
export type SynonymCatalog = Record<string, string[]>;

/**
 * 등록된 모든 카테고리.
 * 같은 표제어가 여러 파일에 있으면 나중 카탈로그가 덮어쓴다.
 * 데이터 규칙: 표제어는 파일 간 중복하지 않는다 (npm run validate:synonyms).
 * Gaze Pack 은 시선 표제어를 담당한다.
 * TODO: 새 JSON 추가 시 import 후 이 배열에 push.
 */
export const SYNONYM_CATALOGS: readonly SynonymCatalog[] = [
  emotion,
  movement,
  appearance,
  nature,
  time,
  action,
  speech,
  gaze,
] as const;

const MAX_SYNONYMS = 5;

function sortHangul(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, "ko"));
}

function normalizeEntry(synonyms: string[]): string[] {
  const cleaned = [
    ...new Set(
      synonyms
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  return sortHangul(cleaned).slice(0, MAX_SYNONYMS);
}

/**
 * 카테고리들을 하나의 Map 으로 합친다.
 * 같은 표제어가 여러 파일에 있으면 나중 카탈로그가 덮어쓴다.
 */
export function buildSynonymIndex(
  catalogs: readonly SynonymCatalog[] = SYNONYM_CATALOGS,
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const catalog of catalogs) {
    for (const [rawKey, list] of Object.entries(catalog)) {
      const key = rawKey.trim();
      if (!key || !Array.isArray(list)) continue;
      index.set(key, normalizeEntry(list));
    }
  }
  return index;
}

/** 모듈 로드 시 1회 구축 — 조회는 O(1) */
export const SYNONYM_INDEX: ReadonlyMap<string, string[]> =
  buildSynonymIndex();

/** 테스트·확장용: 인덱스에서 유의어 조회 */
export function getSynonymsFromIndex(
  headword: string,
  index: ReadonlyMap<string, string[]> = SYNONYM_INDEX,
): string[] {
  const key = headword.trim();
  if (!key) return [];
  return index.get(key) ?? [];
}
