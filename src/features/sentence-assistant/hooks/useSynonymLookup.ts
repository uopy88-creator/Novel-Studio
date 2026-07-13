"use client";

/**
 * 유의어 조회 훅 — Core → Synonym Engine (+ Lemma)
 */

import { useMemo } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import type { SynonymLookupResult } from "@/features/sentence-assistant/engines/synonym/synonym-types";

export function useSynonymLookup(selectedText: string): {
  query: string;
  hasSelection: boolean;
  result: SynonymLookupResult | null;
  synonyms: string[];
} {
  const query = sentenceAssistantCore.normalizeQuery(selectedText);
  const hasSelection = Boolean(query);

  const result = useMemo(
    () =>
      hasSelection ? sentenceAssistantCore.lookupSynonyms(query) : null,
    [hasSelection, query],
  );

  const synonyms = useMemo(() => result?.synonyms ?? [], [result]);

  return { query, hasSelection, result, synonyms };
}
