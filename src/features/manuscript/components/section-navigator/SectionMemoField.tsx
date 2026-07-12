"use client";

/**
 * =============================================================================
 * SectionMemoField — 작가 전용 메모 (원고/export 미포함)
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface SectionMemoFieldProps {
  value: string;
  onChange: (memo: string) => void;
  className?: string;
}

export function SectionMemoField({
  value,
  onChange,
  className,
}: SectionMemoFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className={cn("mt-ns-2", className)}>
      <label className="mb-ns-1 block text-ns-xs font-medium text-ns-ink-tertiary">
        메모
        <span className="ml-1 font-normal">(작가만 · export 제외)</span>
      </label>
      <textarea
        value={draft}
        rows={2}
        placeholder="이 Section에 대한 메모…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          "w-full resize-y rounded-ns-md border border-ns-border bg-ns-surface",
          "px-ns-2 py-ns-1.5 text-ns-xs leading-ns-relaxed text-ns-ink-secondary",
          "placeholder:text-ns-ink-tertiary",
          "outline-none focus-visible:border-ns-accent",
        )}
      />
    </div>
  );
}
