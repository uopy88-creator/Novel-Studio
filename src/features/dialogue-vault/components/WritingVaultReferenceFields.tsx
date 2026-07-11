"use client";

/**
 * =============================================================================
 * WritingVaultReferenceFields
 * -----------------------------------------------------------------------------
 * Reference(영감을 받은 작품): 작품명 · 작가 · 메모
 * =============================================================================
 */

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface WritingVaultReferenceFieldsProps {
  workTitle: string;
  author: string;
  memo: string;
  onWorkTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  className?: string;
}

export function WritingVaultReferenceFields({
  workTitle,
  author,
  memo,
  onWorkTitleChange,
  onAuthorChange,
  onMemoChange,
  className,
}: WritingVaultReferenceFieldsProps) {
  return (
    <fieldset className={cn("flex flex-col gap-ns-4", className)}>
      <legend className="mb-ns-1 text-ns-sm font-medium text-ns-ink">
        Reference
        <span className="ml-ns-2 font-normal text-ns-ink-tertiary">
          영감을 받은 작품 (선택)
        </span>
      </legend>

      <Input
        label="작품명"
        name="reference-work-title"
        value={workTitle}
        onChange={(event) => onWorkTitleChange(event.target.value)}
        placeholder="예: 데미안"
      />

      <Input
        label="작가명"
        name="reference-author"
        value={author}
        onChange={(event) => onAuthorChange(event.target.value)}
        placeholder="선택"
      />

      <div className="flex w-full flex-col gap-ns-2">
        <label
          htmlFor="reference-memo"
          className="text-ns-sm font-medium text-ns-ink"
        >
          메모
        </label>
        <textarea
          id="reference-memo"
          name="reference-memo"
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          placeholder="왜 이 작품에서 영감을 받았는지…"
          rows={2}
          className={cn(
            "w-full resize-y rounded-ns-md border border-ns-border bg-ns-surface",
            "px-ns-4 py-ns-3 text-ns-sm text-ns-ink placeholder:text-ns-ink-tertiary",
            "outline-none focus-visible:border-ns-accent",
          )}
        />
      </div>
    </fieldset>
  );
}
