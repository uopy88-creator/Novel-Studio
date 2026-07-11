"use client";

/**
 * =============================================================================
 * HelpArticle — 본문 렌더러 (데이터 → UI)
 * =============================================================================
 */

import type { HelpBlock, HelpSection } from "@/features/help/types/help";
import { cn } from "@/lib/utils/cn";

export interface HelpArticleProps {
  sections: HelpSection[];
  visibleIds: Set<string> | null;
  className?: string;
}

export function HelpArticle({
  sections,
  visibleIds,
  className,
}: HelpArticleProps) {
  return (
    <div className={cn("flex flex-col gap-ns-10", className)}>
      {sections.map((section) => (
        <SectionView
          key={section.id}
          section={section}
          depth={1}
          visibleIds={visibleIds}
        />
      ))}
    </div>
  );
}

function SectionView({
  section,
  depth,
  visibleIds,
}: {
  section: HelpSection;
  depth: number;
  visibleIds: Set<string> | null;
}) {
  if (visibleIds && !visibleIds.has(section.id)) return null;

  const HeadingTag = depth === 1 ? "h2" : depth === 2 ? "h3" : "h4";

  return (
    <section id={section.id} className="scroll-mt-24">
      <HeadingTag
        className={cn(
          "font-semibold tracking-tight text-ns-ink",
          depth === 1 && "text-ns-2xl",
          depth === 2 && "text-ns-xl",
          depth >= 3 && "text-ns-lg",
        )}
      >
        {section.title}
      </HeadingTag>

      {section.blocks?.length ? (
        <div className="mt-ns-4 flex flex-col gap-ns-4">
          {section.blocks.map((block, index) => (
            <BlockView key={`${section.id}-${index}`} block={block} />
          ))}
        </div>
      ) : null}

      {section.children?.length ? (
        <div className="mt-ns-6 flex flex-col gap-ns-8 border-l border-ns-border pl-ns-5">
          {section.children.map((child) => (
            <SectionView
              key={child.id}
              section={child}
              depth={depth + 1}
              visibleIds={visibleIds}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BlockView({ block }: { block: HelpBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-ns-base leading-ns-relaxed text-ns-ink-secondary">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="list-disc space-y-ns-2 pl-ns-5 text-ns-base leading-ns-relaxed text-ns-ink-secondary">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "shortcut":
      return (
        <div className="flex items-center justify-between gap-ns-3 rounded-ns-md border border-ns-border px-ns-3 py-ns-2.5">
          <span className="text-ns-sm text-ns-ink">{block.action}</span>
          <kbd className="shrink-0 rounded-ns-sm border border-ns-border bg-ns-muted px-ns-2 py-0.5 text-ns-xs text-ns-ink-secondary">
            {block.keys}
          </kbd>
        </div>
      );
    case "faq":
      return (
        <div className="rounded-ns-md border border-ns-border px-ns-4 py-ns-3">
          <p className="text-ns-sm font-medium text-ns-ink">
            <span className="text-ns-ink-tertiary">Q. </span>
            {block.question}
          </p>
          <p className="mt-ns-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            <span className="font-medium text-ns-ink-tertiary">A. </span>
            {block.answer}
          </p>
        </div>
      );
    default:
      return null;
  }
}
