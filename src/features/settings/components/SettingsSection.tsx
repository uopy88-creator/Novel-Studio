"use client";

/**
 * =============================================================================
 * SettingsSection — Notion 스타일 설정 블록
 * =============================================================================
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-ns-xl border border-ns-border bg-ns-surface px-ns-5 py-ns-5",
        className,
      )}
    >
      <header className="mb-ns-4">
        <h3 className="text-ns-sm font-semibold text-ns-ink">{title}</h3>
        {description ? (
          <p className="mt-ns-1 text-ns-xs leading-ns-relaxed text-ns-ink-tertiary">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** 가로 세그먼트 선택 (Notion/Linear 스타일) */
export function SettingsChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-ns-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-ns-sm text-ns-ink">{label}</span>
      <div
        className="inline-flex flex-wrap gap-ns-1 rounded-ns-md border border-ns-border p-0.5"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "min-h-8 rounded-ns-sm px-ns-3 text-ns-xs font-medium transition-colors",
                active
                  ? "bg-ns-muted text-ns-ink"
                  : "text-ns-ink-tertiary hover:text-ns-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
