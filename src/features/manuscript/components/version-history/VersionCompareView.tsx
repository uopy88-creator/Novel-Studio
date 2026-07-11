"use client";

/**
 * =============================================================================
 * VersionCompareView — 문장 단위 추가/삭제/수정 표시
 * =============================================================================
 */

import { useMemo } from "react";
import {
  diffSentences,
  type DiffSentence,
} from "@/features/manuscript/lib/version-diff";
import { cn } from "@/lib/utils/cn";

export interface VersionCompareViewProps {
  beforeLabel: string;
  afterLabel: string;
  beforeContent: string;
  afterContent: string;
  className?: string;
}

export function VersionCompareView({
  beforeLabel,
  afterLabel,
  beforeContent,
  afterContent,
  className,
}: VersionCompareViewProps) {
  const result = useMemo(
    () => diffSentences(beforeContent, afterContent),
    [beforeContent, afterContent],
  );

  const hasChanges =
    result.addedCount + result.deletedCount + result.modifiedCount > 0;

  return (
    <div className={cn("flex flex-col gap-ns-4", className)}>
      <div className="flex flex-wrap items-center gap-ns-3 text-ns-xs text-ns-ink-secondary">
        <span>
          비교: <span className="font-medium text-ns-ink">{beforeLabel}</span>
          {" → "}
          <span className="font-medium text-ns-ink">{afterLabel}</span>
        </span>
        <span className="text-ns-ink-tertiary">·</span>
        <Legend />
      </div>

      <div className="flex flex-wrap gap-ns-3 text-ns-xs">
        <Stat label="추가" count={result.addedCount} tone="added" />
        <Stat label="삭제" count={result.deletedCount} tone="deleted" />
        <Stat label="수정" count={result.modifiedCount} tone="modified" />
      </div>

      {!hasChanges ? (
        <p className="rounded-ns-lg border border-dashed border-ns-border bg-ns-muted/40 px-ns-4 py-ns-6 text-center text-ns-sm text-ns-ink-secondary">
          두 버전의 문장이 동일합니다.
        </p>
      ) : (
        <ul className="max-h-[50vh] space-y-ns-2 overflow-y-auto overscroll-contain pr-ns-1">
          {result.sentences
            .filter((s) => s.kind !== "equal")
            .map((sentence, index) => (
              <DiffRow key={`${sentence.kind}-${index}`} sentence={sentence} />
            ))}
        </ul>
      )}
    </div>
  );
}

function Legend() {
  return (
    <span className="flex flex-wrap items-center gap-ns-2">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
        추가
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-rose-600" aria-hidden />
        삭제
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden />
        수정
      </span>
    </span>
  );
}

function Stat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "added" | "deleted" | "modified";
}) {
  return (
    <span
      className={cn(
        "rounded-ns-md px-ns-2 py-0.5 font-medium",
        tone === "added" && "bg-emerald-50 text-emerald-800",
        tone === "deleted" && "bg-rose-50 text-rose-800",
        tone === "modified" && "bg-amber-50 text-amber-900",
      )}
    >
      {label} {count}
    </span>
  );
}

function DiffRow({ sentence }: { sentence: DiffSentence }) {
  if (sentence.kind === "added") {
    return (
      <li className="rounded-ns-lg border border-emerald-200 bg-emerald-50/80 px-ns-3 py-ns-2 text-ns-sm text-emerald-950">
        <p className="mb-1 text-ns-xs font-medium text-emerald-700">추가된 문장</p>
        <p className="whitespace-pre-wrap leading-relaxed">{sentence.after}</p>
      </li>
    );
  }

  if (sentence.kind === "deleted") {
    return (
      <li className="rounded-ns-lg border border-rose-200 bg-rose-50/80 px-ns-3 py-ns-2 text-ns-sm text-rose-950">
        <p className="mb-1 text-ns-xs font-medium text-rose-700">삭제된 문장</p>
        <p className="whitespace-pre-wrap leading-relaxed line-through opacity-80">
          {sentence.before}
        </p>
      </li>
    );
  }

  if (sentence.kind === "modified") {
    return (
      <li className="rounded-ns-lg border border-amber-200 bg-amber-50/70 px-ns-3 py-ns-2 text-ns-sm text-amber-950">
        <p className="mb-1 text-ns-xs font-medium text-amber-800">수정된 문장</p>
        <p className="mb-ns-2 whitespace-pre-wrap leading-relaxed text-rose-800/90 line-through opacity-80">
          {sentence.before}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed text-emerald-900">
          {sentence.after}
        </p>
      </li>
    );
  }

  return null;
}
