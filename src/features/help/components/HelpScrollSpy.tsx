"use client";

/**
 * =============================================================================
 * HelpScrollSpy — 오른쪽 「지금 읽는 목차」
 * =============================================================================
 */

import type { FlatHelpSection } from "@/features/help/lib/help-utils";
import { cn } from "@/lib/utils/cn";

export interface HelpScrollSpyProps {
  items: FlatHelpSection[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  visibleIds: Set<string> | null;
  className?: string;
}

export function HelpScrollSpy({
  items,
  activeId,
  onNavigate,
  visibleIds,
  className,
}: HelpScrollSpyProps) {
  const filtered = visibleIds
    ? items.filter((item) => visibleIds.has(item.id))
    : items;

  return (
    <aside
      className={cn("hidden xl:block", className)}
      aria-label="현재 읽는 위치"
    >
      <p className="mb-ns-3 text-ns-xs font-medium uppercase tracking-wide text-ns-ink-tertiary">
        이 페이지에서
      </p>
      <ul className="flex flex-col gap-0.5 border-l border-ns-border">
        {filtered.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "-ml-px block w-full border-l-2 py-1 text-left text-ns-xs leading-snug transition-colors",
                  active
                    ? "border-ns-accent font-medium text-ns-accent"
                    : "border-transparent text-ns-ink-tertiary hover:text-ns-ink",
                )}
                style={{ paddingLeft: `${item.depth * 0.65 + 0.75}rem` }}
              >
                <span className="line-clamp-2">{item.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
