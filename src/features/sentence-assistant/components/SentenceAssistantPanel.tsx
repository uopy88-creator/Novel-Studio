"use client";

/**
 * =============================================================================
 * SentenceAssistantPanel
 * -----------------------------------------------------------------------------
 * 우측 Side Panel.
 * 단어 탭 · 표현 탭은 각각 전용 컴포넌트로 분리한다.
 * Show·Tell 탭은 아직 비어 있다.
 * =============================================================================
 */

import { useEffect, useId, useState } from "react";
import {
  SENTENCE_ASSISTANT_TABS,
  type SentenceAssistantTabId,
} from "@/features/sentence-assistant/types";
import { SentenceAssistantWord } from "@/features/sentence-assistant/components/SentenceAssistantWord";
import { SentenceAssistantExpression } from "@/features/sentence-assistant/components/SentenceAssistantExpression";
import { cn } from "@/lib/utils/cn";

export interface SentenceAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  /** 선택된 원문 (작가가 쓴 그대로) */
  selectedText: string;
}

export function SentenceAssistantPanel({
  open,
  onClose,
  selectedText,
}: SentenceAssistantPanelProps) {
  const titleId = useId();
  const [tab, setTab] = useState<SentenceAssistantTabId>("word");

  // 열릴 때마다 단어 탭이 기본
  useEffect(() => {
    if (!open) return;
    setTab("word");
  }, [open, selectedText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[52] flex items-end justify-end md:items-stretch">
      <button
        type="button"
        className="absolute inset-0 bg-ns-overlay"
        aria-label="Sentence Assistant 닫기"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full flex-col bg-ns-surface shadow-ns-lg",
          "rounded-t-ns-xl border border-ns-border md:max-h-none md:rounded-none md:border-y-0 md:border-r-0",
          "md:w-[min(100%,25rem)]", // ~400px
        )}
      >
        <header className="shrink-0 border-b border-ns-border px-ns-4 py-ns-3">
          <div className="flex items-start justify-between gap-ns-2">
            <div className="min-w-0">
              <p className="ns-caption mb-ns-1">참고 도구</p>
              <h2
                id={titleId}
                className="text-ns-base font-semibold text-ns-ink"
              >
                Sentence Assistant
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ns-md text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <p className="mt-ns-2 text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
            작가의 문장은 작가가 씁니다. 문장을 대신 쓰거나 고치지 않습니다.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Sentence Assistant 탭"
          className="flex shrink-0 gap-ns-1 border-b border-ns-border px-ns-3 py-ns-2"
        >
          {SENTENCE_ASSISTANT_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-h-9 flex-1 items-center justify-center gap-1 rounded-ns-md px-ns-2 text-ns-xs font-medium sm:text-ns-sm",
                  active
                    ? "bg-ns-accent-soft text-ns-accent"
                    : "text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-ns-4 py-ns-5"
        >
          {tab === "word" ? (
            <SentenceAssistantWord selectedText={selectedText} />
          ) : tab === "expression" ? (
            <SentenceAssistantExpression selectedText={selectedText} />
          ) : (
            <PlaceholderTab selectedText={selectedText} />
          )}
        </div>

        <footer className="shrink-0 border-t border-ns-border px-ns-4 py-ns-2 text-center text-ns-xs text-ns-ink-tertiary">
          Esc · 바깥 클릭으로 닫기
        </footer>
      </aside>
    </div>
  );
}

function PlaceholderTab({ selectedText }: { selectedText: string }) {
  return (
    <div className="flex flex-col gap-ns-4">
      {selectedText.trim() ? (
        <section>
          <h3 className="text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
            선택
          </h3>
          <p className="mt-ns-2 whitespace-pre-wrap break-words text-ns-sm text-ns-ink">
            “{selectedText.trim()}”
          </p>
        </section>
      ) : null}
      <h3 className="text-ns-sm font-semibold text-ns-ink">👁 Show / Tell</h3>
      <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        설명(Tell)과 보여 주기(Show)를 구분하는 참고가 여기에 표시됩니다. (준비
        중)
      </p>
      <div className="rounded-ns-md border border-dashed border-ns-border px-ns-4 py-ns-8 text-center text-ns-xs text-ns-ink-tertiary">
        아직 참고 데이터가 없습니다.
      </div>
    </div>
  );
}
