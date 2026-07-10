/**
 * =============================================================================
 * RecentDocumentCard
 * -----------------------------------------------------------------------------
 * 최근 수정한 Document(Chapter) 한 줄.
 * Dashboard는 보기 전용이므로 편집 버튼은 두지 않는다.
 * (목록으로 이동하는 링크만 허용 — 수정 UI 아님)
 * =============================================================================
 */

import Link from "next/link";
import type { RecentDocumentItem } from "@/features/dashboard/lib/dashboard-data";
import { formatShortDate } from "@/lib/format-date";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface RecentDocumentCardProps {
  document: RecentDocumentItem;
  /** Chapters 목록으로 이동할 때 사용 */
  projectId: string;
  className?: string;
}

export function RecentDocumentCard({
  document,
  projectId,
  className,
}: RecentDocumentCardProps) {
  return (
    <Card
      variant="outlined"
      padding="md"
      className={cn("transition-colors hover:bg-ns-muted/50", className)}
    >
      <Link
        href={`/projects/${projectId}/chapters`}
        className="block min-w-0 rounded-ns-md outline-none focus-visible:shadow-[var(--ns-ring-accent)]"
      >
        <div className="flex flex-wrap items-baseline gap-ns-2">
          <span className="text-ns-sm font-medium text-ns-accent">
            {document.number}화
          </span>
          <h3 className="text-ns-base font-semibold text-ns-ink">
            {document.title}
          </h3>
        </div>
        {document.summary ? (
          <p className="mt-ns-2 line-clamp-2 text-ns-sm text-ns-ink-secondary">
            {document.summary}
          </p>
        ) : (
          <p className="mt-ns-2 text-ns-sm text-ns-ink-tertiary">설명 없음</p>
        )}
        <p className="mt-ns-3 text-ns-xs text-ns-ink-tertiary">
          수정 {formatShortDate(document.updatedAt)}
        </p>
      </Link>
    </Card>
  );
}
