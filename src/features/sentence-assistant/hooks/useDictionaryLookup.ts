"use client";

/**
 * 단어 뜻 조회 훅 — Core → Lemma → Dictionary Engine
 * 선택 원문은 화면에 그대로 두고, 검색은 기본형으로 수행한다.
 */

import { useEffect, useState } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import type { DictionaryLookupResult } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";

export type DictionaryLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; result: DictionaryLookupResult };

export function useDictionaryLookup(selectedText: string): {
  /** 작가가 선택한 원문(정규화) — UI 「선택」표시용 */
  query: string;
  /** Lemma Engine 기본형 — 실제 사전 검색어 */
  lemma: string;
  state: DictionaryLoadState;
} {
  const query = sentenceAssistantCore.normalizeQuery(selectedText);
  const lemma = query ? sentenceAssistantCore.resolveLemma(query) : "";
  const [state, setState] = useState<DictionaryLoadState>({ status: "idle" });

  useEffect(() => {
    if (!query) {
      setState({
        status: "ready",
        result: { status: "not_found", query: "" },
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    void (async () => {
      try {
        // Core 가 내부에서 Lemma → Dictionary 순으로 처리
        const result = await sentenceAssistantCore.lookupDefinition(
          query,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setState({ status: "ready", result });
      } catch {
        if (controller.signal.aborted) return;
        setState({
          status: "ready",
          result: { status: "error", query: lemma || query },
        });
      }
    })();

    return () => controller.abort();
  }, [query, lemma]);

  return { query, lemma, state };
}
