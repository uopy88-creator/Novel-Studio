"use client";

/**
 * =============================================================================
 * SectionNavigatorToolbar
 * -----------------------------------------------------------------------------
 * 「＋ 새 Section」· 접기/펼치기 · Timeline 연동 링크
 * =============================================================================
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface SectionNavigatorToolbarProps {
  sectionCount: number;
  onAdd: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  /** 선택 Section을 Timeline 사건에 연결하는 경로 */
  timelineHref?: string | null;
}

export function SectionNavigatorToolbar({
  sectionCount,
  onAdd,
  onCollapseAll,
  onExpandAll,
  timelineHref,
}: SectionNavigatorToolbarProps) {
  return (
    <div className="flex flex-col gap-ns-2 border-b border-ns-border px-ns-3 py-ns-3">
      <div className="flex items-center justify-between gap-ns-2">
        <div>
          <p className="text-ns-xs font-medium text-ns-ink-tertiary">Section</p>
          <p className="text-ns-sm font-semibold text-ns-ink">
            {sectionCount}개
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onAdd}
        >
          ＋ 새 Section
        </Button>
      </div>
      <div className="flex flex-wrap gap-ns-2">
        <button
          type="button"
          className="text-ns-xs font-medium text-ns-ink-secondary hover:text-ns-ink"
          onClick={onCollapseAll}
        >
          모두 접기
        </button>
        <span className="text-ns-xs text-ns-ink-tertiary">·</span>
        <button
          type="button"
          className="text-ns-xs font-medium text-ns-ink-secondary hover:text-ns-ink"
          onClick={onExpandAll}
        >
          모두 펼치기
        </button>
        {timelineHref ? (
          <>
            <span className="text-ns-xs text-ns-ink-tertiary">·</span>
            <Link
              href={timelineHref}
              className="text-ns-xs font-medium text-ns-ink-secondary hover:text-ns-ink"
            >
              Timeline에 추가
            </Link>
          </>
        ) : null}
      </div>
      <p className="text-ns-xs leading-ns-normal text-ns-ink-tertiary">
        Section을 끌어 순서를 바꿀 수 있습니다. 번호는 자동으로 다시 매겨집니다.
      </p>
    </div>
  );
}
