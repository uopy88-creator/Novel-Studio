"use client";

/**
 * =============================================================================
 * SentenceAssistantWord
 * -----------------------------------------------------------------------------
 * 📖 단어 탭 — 선택한 단어의 「뜻」만 표시한다.
 * 유의어·예문·AI 추천·문장 수정은 다루지 않는다.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import {
  DICTIONARY_NOT_FOUND_MESSAGE,
  type DictionaryLookupResult,
} from "@/features/sentence-assistant/lib/dictionary-types";
import { DictionaryService } from "@/features/sentence-assistant/lib/DictionaryService";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export interface SentenceAssistantWordProps {
  selectedText: string;
}

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; result: DictionaryLookupResult }
  | { status: "error" };

export function SentenceAssistantWord({
  selectedText,
}: SentenceAssistantWordProps) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const query = normalizeDictionaryQuery(selectedText);

  useEffect(() => {
    if (!query) {
      setState({
        status: "ready",
        result: { query: "", definition: null },
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    void (async () => {
      try {
        const result = await DictionaryService.lookupDefinition(
          query,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setState({ status: "ready", result });
      } catch {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
      }
    })();

    return () => controller.abort();
  }, [query]);

  const displayWord = query || selectedText.trim() || "—";

  return (
    <div className="flex flex-col gap-ns-5">
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          선택
        </h3>
        <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
          “{displayWord}”
        </p>
      </section>

      <div className="border-t border-ns-border" />

      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          뜻
        </h3>
        <DefinitionBody state={state} />
      </section>
    </div>
  );
}

function DefinitionBody({ state }: { state: LoadState }) {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <p className="mt-ns-2 text-ns-sm text-ns-ink-tertiary">뜻을 찾는 중…</p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="mt-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {DICTIONARY_NOT_FOUND_MESSAGE}
      </p>
    );
  }

  const definition = state.result.definition?.trim();
  if (!definition) {
    return (
      <p className="mt-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {DICTIONARY_NOT_FOUND_MESSAGE}
      </p>
    );
  }

  return (
    <div className="mt-ns-2 flex flex-col gap-ns-2">
      <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {definition}
      </p>
      {state.result.source ? (
        <p className="text-ns-xs text-ns-ink-tertiary">
          출처 · {state.result.source}
        </p>
      ) : null}
    </div>
  );
}
