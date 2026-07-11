"use client";

/**
 * =============================================================================
 * SentenceAssistantPanel
 * -----------------------------------------------------------------------------
 * 우측 Side Panel 골격.
 * 탭(단어 / 표현 / Show·Tell)은 비어 있어도 되며, 향후 참고 정보만 채운다.
 * 문장 생성·수정 UI는 넣지 않는다.
 * =============================================================================
 */

import { useEffect, useId, useState } from "react";
import {
  SENTENCE_ASSISTANT_TABS,
  type SentenceAssistantTabId,
} from "@/features/sentence-assistant/types";
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

  const display =
    selectedText.trim().length > 0
      ? selectedText
      : "(선택된 문장이 없습니다)";

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

          <div className="mt-ns-3 rounded-ns-md border border-ns-border bg-ns-muted/40 px-ns-3 py-ns-2.5">
            <p className="text-ns-xs font-medium text-ns-ink-tertiary">
              선택한 문장
            </p>
            <p className="mt-ns-1 whitespace-pre-wrap break-words text-ns-sm leading-ns-relaxed text-ns-ink">
              {display}
            </p>
          </div>

          <p className="mt-ns-3 text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
            작가의 문장은 작가가 씁니다. 이 패널은 표현을 고르는 데 도움이 되는
            참고만 제공합니다. 문장을 대신 쓰거나 고치지 않습니다.
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
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-ns-4 py-ns-6"
        >
          <EmptyTabBody tab={tab} />
        </div>

        <footer className="shrink-0 border-t border-ns-border px-ns-4 py-ns-2 text-center text-ns-xs text-ns-ink-tertiary">
          Esc · 바깥 클릭으로 닫기
        </footer>
      </aside>
    </div>
  );
}

function EmptyTabBody({ tab }: { tab: SentenceAssistantTabId }) {
  const copy: Record<
    SentenceAssistantTabId,
    { title: string; body: string }
  > = {
    word: {
      title: "📖 단어",
      body: "선택한 표현과 가까운 단어·뉘앙스 참고가 여기에 표시됩니다. (준비 중)",
    },
    expression: {
      title: "✍ 표현",
      body: "비슷한 문장 표현·어감 참고가 여기에 표시됩니다. (준비 중)",
    },
    "show-tell": {
      title: "👁 Show / Tell",
      body: "설명(Tell)과 보여 주기(Show)를 구분하는 참고가 여기에 표시됩니다. (준비 중)",
    },
  };

  const item = copy[tab];

  return (
    <div className="flex flex-col items-start gap-ns-3">
      <h3 className="text-ns-sm font-semibold text-ns-ink">{item.title}</h3>
      <p className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
        {item.body}
      </p>
      <div className="mt-ns-4 w-full rounded-ns-md border border-dashed border-ns-border px-ns-4 py-ns-8 text-center text-ns-xs text-ns-ink-tertiary">
        아직 참고 데이터가 없습니다.
      </div>
    </div>
  );
}
