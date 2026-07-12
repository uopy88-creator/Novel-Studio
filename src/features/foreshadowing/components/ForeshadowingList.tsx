"use client";

/**
 * =============================================================================
 * ForeshadowingList
 * -----------------------------------------------------------------------------
 * 복선 카드 그리드 + 빈 상태.
 * =============================================================================
 */

import type { ReactNode } from "react";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { ForeshadowingCard } from "@/features/foreshadowing/components/ForeshadowingCard";

export interface ForeshadowingListProps {
  items: Foreshadowing[];
  /** 검색·필터 결과가 비었는지 (안내 문구 분기) */
  isFilterEmpty?: boolean;
  onEdit: (foreshadowing: Foreshadowing) => void;
  onDelete: (foreshadowing: Foreshadowing) => void;
  emptyAction?: ReactNode;
}

export function ForeshadowingList({
  items,
  isFilterEmpty,
  onEdit,
  onDelete,
  emptyAction,
}: ForeshadowingListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-12 text-center">
        <p className="text-ns-base font-medium text-ns-ink">
          {isFilterEmpty ? "검색 결과가 없습니다" : "아직 복선이 없습니다"}
        </p>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          {isFilterEmpty
            ? "다른 검색어나 필터를 시도해 보세요."
            : "심어 둔 복선과 회수할 약속을 기록해 보세요."}
        </p>
        {!isFilterEmpty && emptyAction ? (
          <div className="mt-ns-6 flex justify-center">{emptyAction}</div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-ns-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <ForeshadowingCard
            foreshadowing={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
