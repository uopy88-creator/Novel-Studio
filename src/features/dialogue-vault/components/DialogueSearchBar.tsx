"use client";

/**
 * =============================================================================
 * DialogueSearchBar
 * -----------------------------------------------------------------------------
 * 대사 내용과 태그를 동시에 검색한다.
 * =============================================================================
 */

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface DialogueSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** 현재 결과 건수 (힌트용) */
  resultCount?: number;
  className?: string;
}

export function DialogueSearchBar({
  value,
  onChange,
  resultCount,
  className,
}: DialogueSearchBarProps) {
  const hint =
    value.trim().length > 0 && typeof resultCount === "number"
      ? `${resultCount}건`
      : "제목·내용·태그·Reference를 검색합니다";

  return (
    <div className={cn("w-full", className)}>
      <Input
        label="검색"
        name="writing-vault-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="단어, 문장, 태그, 작품명…"
        hint={hint}
      />
    </div>
  );
}
