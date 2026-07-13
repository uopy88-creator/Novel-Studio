"use client";

/**
 * 단어 뜻 조회 훅 — Core → Dictionary Engine
 */

import { useEffect, useState } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import type { DictionaryLookupResult } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";

export type DictionaryLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; result: DictionaryLookupResult };

export function useDictionaryLookup(selectedText: string): {
  query: string;
  state: DictionaryLoadState;
} {
  const query = sentenceAssistantCore.normalizeQuery(selectedText);
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
          result: { status: "error", query },
        });
      }
    })();

    return () => controller.abort();
  }, [query]);

  return { query, state };
}
