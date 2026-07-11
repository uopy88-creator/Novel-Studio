"use client";

/**
 * =============================================================================
 * HelpToc — 왼쪽/상단 목차 (접기·펼치기)
 * =============================================================================
 */

import type { HelpSection } from "@/features/help/types/help";
import { cn } from "@/lib/utils/cn";

export interface HelpTocProps {
  sections: HelpSection[];
  activeId: string | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  /** 검색 시 표시할 id (null = 전체) */
  visibleIds: Set<string> | null;
  className?: string;
}

export function HelpToc({
  sections,
  activeId,
  expanded,
  onToggle,
  onNavigate,
  visibleIds,
  className,
}: HelpTocProps) {
  return (
    <nav className={cn("text-ns-sm", className)} aria-label="도움말 목차">
      <ul className="flex flex-col gap-0.5">
        {sections.map((section) => (
          <TocNode
            key={section.id}
            section={section}
            depth={0}
            activeId={activeId}
            expanded={expanded}
            onToggle={onToggle}
            onNavigate={onNavigate}
            visibleIds={visibleIds}
          />
        ))}
      </ul>
    </nav>
  );
}

function TocNode({
  section,
  depth,
  activeId,
  expanded,
  onToggle,
  onNavigate,
  visibleIds,
}: {
  section: HelpSection;
  depth: number;
  activeId: string | null;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  visibleIds: Set<string> | null;
}) {
  if (visibleIds && !visibleIds.has(section.id)) return null;

  const hasChildren = Boolean(section.children?.length);
  const isOpen = expanded[section.id] !== false;
  const active = activeId === section.id;

  return (
    <li>
      <div
        className={cn(
          "flex min-h-9 items-center gap-ns-1 rounded-ns-md",
          active ? "bg-ns-accent-soft text-ns-accent" : "text-ns-ink-secondary",
        )}
        style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-ns-md hover:bg-ns-surface hover:text-ns-ink"
            aria-expanded={isOpen}
            aria-label={isOpen ? "접기" : "펼치기"}
            onClick={() => onToggle(section.id)}
          >
            <span aria-hidden className="text-ns-xs">
              {isOpen ? "▾" : "▸"}
            </span>
          </button>
        ) : (
          <span className="w-7 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate py-ns-1.5 pr-ns-2 text-left font-medium",
            !active && "hover:text-ns-ink",
          )}
          onClick={() => onNavigate(section.id)}
        >
          {section.title}
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul className="flex flex-col gap-0.5">
          {section.children!.map((child) => (
            <TocNode
              key={child.id}
              section={child}
              depth={depth + 1}
              activeId={activeId}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
              visibleIds={visibleIds}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
