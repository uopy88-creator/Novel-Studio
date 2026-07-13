/**
 * =============================================================================
 * DictionaryService — 하위 호환 파사드
 * -----------------------------------------------------------------------------
 * 구현은 Core → Dictionary Engine. 기존 import 경로 유지.
 * =============================================================================
 */

import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import { dictionaryEngine } from "@/features/sentence-assistant/engines/dictionary/DictionaryEngine";
import type { DictionaryLookupResult } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/utils/normalize-query";

export async function lookupDefinition(
  rawQuery: string,
  signal?: AbortSignal,
): Promise<DictionaryLookupResult> {
  return sentenceAssistantCore.lookupDefinition(rawQuery, signal);
}

export function clearDictionaryCache(): void {
  dictionaryEngine.clearCache();
}

export const DictionaryService = {
  lookupDefinition,
  normalizeQuery: normalizeDictionaryQuery,
  clearCache: clearDictionaryCache,
};
