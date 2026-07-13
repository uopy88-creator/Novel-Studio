/**
 * =============================================================================
 * 표준국어대사전 JSON → DictionaryEntry
 * -----------------------------------------------------------------------------
 * 한 번의 API 응답에서 의미(sense)를 추출한다.
 * - API 순서 유지
 * - 동일 뜻풀이 중복 제거
 * - 최대 DICTIONARY_MAX_SENSES (2) 개
 * - 동음이의어(여러 item)도 순서대로 수집
 * =============================================================================
 */

import {
  DICTIONARY_MAX_SENSES,
  type DictionaryEntry,
  type DictionarySense,
} from "@/features/sentence-assistant/engines/dictionary/dictionary-types";

interface StdictSense {
  definition?: string;
  pos?: string;
  link?: string | { [key: string]: unknown };
}

interface StdictItem {
  word?: string;
  pos?: string;
  sense?: StdictSense | StdictSense[];
}

interface StdictChannel {
  total?: number | string;
  item?: StdictItem | StdictItem[];
}

export function asLinkString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const joined = Object.keys(value as object)
      .join("")
      .trim();
    if (joined.startsWith("http")) return joined;
  }
  return null;
}

function normalizeDefinitionKey(definition: string): string {
  return definition.replace(/\s+/g, " ").trim();
}

function toSenseList(sense: StdictItem["sense"]): StdictSense[] {
  if (!sense) return [];
  return Array.isArray(sense) ? sense : [sense];
}

function toItemList(item: StdictChannel["item"]): StdictItem[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * STDICT JSON 에서 표제어 + 의미(최대 2)를 만든다.
 * 추가 API 호출 없음.
 */
export function parseStdictEntry(
  payload: unknown,
  query: string,
): DictionaryEntry | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { channel?: StdictChannel };
  const channel = root.channel;
  if (!channel) return null;

  const items = toItemList(channel.item);
  if (items.length === 0) return null;

  const senses: DictionarySense[] = [];
  const seenDefinitions = new Set<string>();
  let firstLink: string | null = null;
  const word = (items[0]?.word ?? query).trim() || query;

  // item 순서 → sense 순서 (국립국어원 반환 순서 유지)
  outer: for (const item of items) {
    const itemPos = item.pos?.trim() || "";
    for (const raw of toSenseList(item.sense)) {
      const definition = raw.definition?.trim() ?? "";
      if (!definition) continue;

      const key = normalizeDefinitionKey(definition);
      if (seenDefinitions.has(key)) continue;
      seenDefinitions.add(key);

      const pos = (raw.pos?.trim() || itemPos || "") || null;
      senses.push({ definition, pos });

      if (!firstLink) {
        firstLink = asLinkString(raw.link);
      }

      if (senses.length >= DICTIONARY_MAX_SENSES) break outer;
    }
  }

  if (senses.length === 0) return null;

  const link =
    firstLink ||
    `https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=${encodeURIComponent(word)}`;

  return {
    query,
    word,
    pos: senses[0].pos,
    definition: senses[0].definition,
    link,
    senses,
  };
}
