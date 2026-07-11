"use client";

/**
 * =============================================================================
 * ContextHelpPanel — 페이지별 도움말 Side Panel / Bottom Sheet
 * -----------------------------------------------------------------------------
 * Desktop: 우측 패널 (~380px)
 * Mobile: 하단 시트
 * ESC 로 닫기. 전체 /help 이동은 하단 버튼만.
 * =============================================================================
 */

import { useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectId } from "@/types/ids";
import type { ContextHelpTopicId } from "@/features/help/context/types";
import { getContextHelp } from "@/features/help/context/registry";
import { studioPath } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils/cn";

export interface ContextHelpPanelProps {
  open: boolean;
  onClose: () => void;
  topic: ContextHelpTopicId;
  /** 관련 기능 studioPath 용 (Projects 목록이면 생략) */
  projectId?: ProjectId | string | null;
}

export function ContextHelpPanel({
  open,
  onClose,
  topic,
  projectId,
}: ContextHelpPanelProps) {
  const titleId = useId();
  const router = useRouter();
  const content = getContextHelp(topic);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullHelpHref = "/help";

  const goRelated = (segment?: string, href?: string) => {
    if (href) {
      onClose();
      router.push(href);
      return;
    }
    if (segment && projectId) {
      onClose();
      router.push(studioPath(String(projectId), segment));
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-end md:items-stretch">
      <button
        type="button"
        className="absolute inset-0 bg-ns-overlay"
        aria-label="도움말 닫기"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full flex-col bg-ns-surface shadow-ns-lg",
          "rounded-t-ns-xl border border-ns-border md:max-h-none md:rounded-none md:border-y-0 md:border-r-0",
          "md:w-[min(100%,24.5rem)]", // ~392px
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-ns-2 border-b border-ns-border px-ns-4 py-ns-3">
          <h2
            id={titleId}
            className="min-w-0 truncate text-ns-base font-semibold text-ns-ink"
          >
            {content.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ns-md text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink"
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-ns-4 py-ns-4">
          <Section title="기능 설명">
            {content.description.map((p) => (
              <p
                key={p}
                className="text-ns-sm leading-ns-relaxed text-ns-ink-secondary"
              >
                {p}
              </p>
            ))}
          </Section>

          {content.steps?.length ? (
            <Section title="사용 순서">
              <ol className="list-decimal space-y-ns-2 pl-ns-5 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
                {content.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Section>
          ) : null}

          {content.tips?.length ? (
            <Section title="TIP">
              <ul className="space-y-ns-2">
                {content.tips.map((tip) => (
                  <li
                    key={tip}
                    className="rounded-ns-md border border-ns-border bg-ns-muted/40 px-ns-3 py-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {content.faqs?.length ? (
            <Section title="자주 하는 질문">
              <ul className="space-y-ns-3">
                {content.faqs.map((faq) => (
                  <li
                    key={faq.question}
                    className="rounded-ns-md border border-ns-border px-ns-3 py-ns-2.5"
                  >
                    <p className="text-ns-sm font-medium text-ns-ink">
                      <span className="text-ns-ink-tertiary">Q. </span>
                      {faq.question}
                    </p>
                    <p className="mt-ns-1.5 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
                      <span className="font-medium text-ns-ink-tertiary">
                        A.{" "}
                      </span>
                      {faq.answer}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {content.related?.length ? (
            <Section title="관련 기능">
              <ul className="flex flex-col gap-ns-1">
                {content.related.map((link) => {
                  const canNavigate =
                    Boolean(link.href) ||
                    (Boolean(link.segment) && Boolean(projectId));
                  return (
                    <li key={link.label}>
                      <button
                        type="button"
                        disabled={!canNavigate}
                        onClick={() => goRelated(link.segment, link.href)}
                        className={cn(
                          "flex w-full items-center gap-ns-2 rounded-ns-md px-ns-3 py-ns-2 text-left text-ns-sm",
                          canNavigate
                            ? "text-ns-accent hover:bg-ns-accent-soft"
                            : "cursor-default text-ns-ink-tertiary",
                        )}
                      >
                        <span aria-hidden>→</span>
                        <span>{link.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-ns-border px-ns-4 py-ns-3">
          <Link
            href={fullHelpHref}
            onClick={onClose}
            className={cn(
              "flex min-h-ns-touch w-full items-center justify-center rounded-ns-md border border-ns-border",
              "bg-ns-surface text-ns-sm font-medium text-ns-ink",
              "hover:bg-ns-muted hover:border-ns-border-strong",
            )}
          >
            전체 도움말 보기
          </Link>
          <p className="mt-ns-2 text-center text-ns-xs text-ns-ink-tertiary">
            Esc 로 닫기
          </p>
        </footer>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-ns-6 last:mb-0">
      <h3 className="mb-ns-2 text-ns-xs font-semibold uppercase tracking-wide text-ns-ink-tertiary">
        {title}
      </h3>
      <div className="flex flex-col gap-ns-2">{children}</div>
    </section>
  );
}
