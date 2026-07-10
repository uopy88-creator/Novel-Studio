"use client";

/**
 * =============================================================================
 * InspirationList
 * =============================================================================
 */

import type { ReactNode } from "react";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { InspirationCard } from "@/features/inspiration/components/InspirationCard";

export interface InspirationListProps {
  inspirations: Inspiration[];
  isSearchEmpty?: boolean;
  onOpen: (inspiration: Inspiration) => void;
  onDelete: (inspiration: Inspiration) => void;
  emptyAction?: ReactNode;
}

export function InspirationList({
  inspirations,
  isSearchEmpty,
  onOpen,
  onDelete,
  emptyAction,
}: InspirationListProps) {
  if (inspirations.length === 0) {
    return (
      <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-12 text-center">
        <p className="text-ns-base font-medium text-ns-ink">
          {isSearchEmpty ? "검색 결과가 없습니다" : "아직 영감 노트가 없습니다"}
        </p>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          {isSearchEmpty
            ? "다른 키워드로 검색해 보세요."
            : "Manuscript에서 문장을 선택한 뒤 💡 영감 추가로 남겨 보세요."}
        </p>
        {!isSearchEmpty && emptyAction ? (
          <div className="mt-ns-6 flex justify-center">{emptyAction}</div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-ns-4 md:grid-cols-2">
      {inspirations.map((inspiration) => (
        <li key={inspiration.id}>
          <InspirationCard
            inspiration={inspiration}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
