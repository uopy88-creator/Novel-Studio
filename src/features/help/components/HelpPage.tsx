"use client";

/**
 * =============================================================================
 * HelpPage
 * -----------------------------------------------------------------------------
 * Notion 스타일 스크롤 문서.
 * - 상단 검색
 * - 좌측 목차(접기/펼치기)
 * - 우측 Scroll Spy
 * - 본문은 HELP_DOCUMENT 데이터만 렌더
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HELP_DOCUMENT } from "@/features/help/data/help-content";
import { HelpArticle } from "@/features/help/components/HelpArticle";
import { HelpScrollSpy } from "@/features/help/components/HelpScrollSpy";
import { HelpToc } from "@/features/help/components/HelpToc";
import {
  collapsibleParentIds,
  collectMatchingSectionIds,
  flattenSections,
} from "@/features/help/lib/help-utils";
import { cn } from "@/lib/utils/cn";

export interface HelpPageProps {
  /** 작업실에서 열린 경우 돌아갈 경로 */
  backHref?: string;
  backLabel?: string;
  /** AppLayout 안이면 상단 브랜드 바 생략 */
  embedded?: boolean;
}

export function HelpPage({
  backHref = "/",
  backLabel = "작품 목록",
  embedded = false,
}: HelpPageProps) {
  const doc = HELP_DOCUMENT;
  const flat = useMemo(() => flattenSections(doc.sections), [doc.sections]);
  const parentIds = useMemo(
    () => collapsibleParentIds(doc.sections),
    [doc.sections],
  );

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(
    doc.sections[0]?.id ?? null,
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const id of parentIds) initial[id] = true;
    return initial;
  });

  const visibleIds = useMemo(
    () => collectMatchingSectionIds(doc, query),
    [doc, query],
  );

  // 검색 중에는 매칭된 조상을 펼친다
  useEffect(() => {
    if (!visibleIds) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const id of parentIds) {
        if (visibleIds.has(id)) next[id] = true;
      }
      return next;
    });
  }, [visibleIds, parentIds]);

  const navigateTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    // URL 해시 (공유·북마크)
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !(prev[id] !== false) }));
  }, []);

  // Scroll Spy
  useEffect(() => {
    const nodes = flat
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0),
          );
        const top = visible[0]?.target;
        if (top?.id) setActiveId(top.id);
      },
      {
        root: null,
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [flat, visibleIds]);

  // 초기 해시
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const t = window.setTimeout(() => navigateTo(hash), 80);
    return () => window.clearTimeout(t);
  }, [navigateTo]);

  const noMatches = visibleIds !== null && visibleIds.size === 0;

  return (
    <div
      className={cn(
        "min-h-dvh bg-ns-canvas text-ns-ink",
        embedded ? "min-h-0" : "",
      )}
    >
      {!embedded ? (
        <header className="sticky top-0 z-20 border-b border-ns-border bg-ns-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-ns-3 px-ns-4 sm:px-ns-6">
            <Link
              href={backHref}
              className="rounded-ns-md px-ns-2 py-ns-1 text-ns-sm text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink"
            >
              ← {backLabel}
            </Link>
            <span className="text-ns-ink-tertiary">/</span>
            <span className="text-ns-sm font-semibold text-ns-ink">Help</span>
          </div>
        </header>
      ) : null}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-ns-8 px-ns-4 py-ns-8 sm:px-ns-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_12rem]">
        {/* 좌측 목차 */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-ns-3 text-ns-xs font-medium uppercase tracking-wide text-ns-ink-tertiary">
            목차
          </p>
          <HelpToc
            sections={doc.sections}
            activeId={activeId}
            expanded={expanded}
            onToggle={onToggle}
            onNavigate={navigateTo}
            visibleIds={visibleIds}
            className="max-h-[70vh] overflow-y-auto pr-ns-2"
          />
        </div>

        {/* 본문 */}
        <div className="min-w-0">
          <div className="mb-ns-8">
            <p className="ns-caption mb-ns-2">Help Center</p>
            <h1 className="ns-title">{doc.title}</h1>
            <p className="mt-ns-2 max-w-2xl text-ns-sm text-ns-ink-secondary">
              {doc.subtitle}
            </p>

            <label className="mt-ns-6 block">
              <span className="sr-only">Help 검색</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Help 내용 검색…"
                className={cn(
                  "w-full max-w-xl rounded-ns-md border border-ns-border bg-ns-surface px-ns-4 py-ns-3",
                  "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
                  "outline-none focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
                )}
              />
            </label>
          </div>

          {noMatches ? (
            <p className="py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
              검색 결과가 없습니다.
            </p>
          ) : (
            <HelpArticle sections={doc.sections} visibleIds={visibleIds} />
          )}
        </div>

        {/* 우측 Spy */}
        <HelpScrollSpy
          items={flat}
          activeId={activeId}
          onNavigate={navigateTo}
          visibleIds={visibleIds}
          className="sticky top-20 self-start max-h-[70vh] overflow-y-auto"
        />
      </div>
    </div>
  );
}
