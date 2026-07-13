"use client";

/**
 * =============================================================================
 * SentenceAssistantWord
 * -----------------------------------------------------------------------------
 * 📖 단어 탭 — 국립국어원 표준국어대사전으로 「단어 뜻」을 표시한다.
 * 조회는 Core Engine → Dictionary Engine 경로만 사용한다.
 * =============================================================================
 */

import {
  DICTIONARY_ERROR_MESSAGE,
  DICTIONARY_NOT_FOUND_MESSAGE,
} from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import {
  useDictionaryLookup,
  type DictionaryLoadState,
} from "@/features/sentence-assistant/hooks/useDictionaryLookup";
import { cn } from "@/lib/utils/cn";

export interface SentenceAssistantWordProps {
  selectedText: string;
}

export function SentenceAssistantWord({
  selectedText,
}: SentenceAssistantWordProps) {
  const { query, state } = useDictionaryLookup(selectedText);

  return (
    <div className="flex flex-col gap-ns-5">
      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          선택
        </h3>
        <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-base font-medium leading-ns-relaxed text-ns-ink">
          “{query || selectedText.trim() || "—"}”
        </p>
      </section>

      <div className="border-t border-ns-border" />

      <section>
        <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
          단어 뜻
        </h3>
        <DefinitionBody state={state} />
      </section>
    </div>
  );
}

function DefinitionBody({ state }: { state: DictionaryLoadState }) {
  if (state.status === "loading" || state.status === "idle") {
    return (
      <div
        className="mt-ns-3 flex items-center gap-ns-2 text-ns-sm text-ns-ink-tertiary"
        role="status"
        aria-live="polite"
      >
        <span
          className={cn(
            "inline-block h-4 w-4 shrink-0 rounded-full border-2 border-ns-border",
            "border-t-ns-accent animate-spin",
          )}
          aria-hidden
        />
        검색 중…
      </div>
    );
  }

  const { result } = state;

  if (result.status === "error") {
    return (
      <p className="mt-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {DICTIONARY_ERROR_MESSAGE}
      </p>
    );
  }

  if (result.status === "not_found" || !result.entry) {
    return (
      <p className="mt-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {DICTIONARY_NOT_FOUND_MESSAGE}
      </p>
    );
  }

  const { word, pos, definition, link } = result.entry;

  return (
    <div className="mt-ns-2 flex flex-col gap-ns-3">
      <div>
        <p className="text-ns-base font-semibold text-ns-ink">{word}</p>
        {pos ? (
          <p className="mt-ns-1 text-ns-xs text-ns-ink-tertiary">{pos}</p>
        ) : null}
      </div>

      <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {definition}
      </p>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ns-xs font-medium text-ns-accent underline-offset-2 hover:underline"
        >
          표준국어대사전에서 보기
        </a>
      ) : (
        <p className="text-ns-xs text-ns-ink-tertiary">출처 · 표준국어대사전</p>
      )}
    </div>
  );
}
