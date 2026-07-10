"use client";

/**
 * =============================================================================
 * DocumentCard
 * -----------------------------------------------------------------------------
 * Document 목록의 카드.
 * - 카드 클릭 → Manuscript 화면으로 이동
 * - 수정/삭제는 버튼으로 처리 (클릭 전파 중단)
 * =============================================================================
 */

import Link from "next/link";
import type { Chapter } from "@/features/manuscript/types/chapter";
import { DOCUMENT_KIND_LABELS } from "@/features/manuscript/types/chapter";
import { formatShortDate } from "@/features/manuscript/lib/format-date";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface DocumentCardProps {
  document: Chapter;
  projectId: string;
  /** 목록 표시 번호 (1부터) */
  number: number;
  onEdit: (document: Chapter) => void;
  onDelete: (document: Chapter) => void;
  className?: string;
}

export function DocumentCard({
  document,
  projectId,
  number,
  onEdit,
  onDelete,
  className,
}: DocumentCardProps) {
  const href = `/projects/${projectId}/manuscript?documentId=${document.id}`;
  const kindLabel = DOCUMENT_KIND_LABELS[document.kind] ?? "소설";

  return (
    <Card
      variant="outlined"
      padding="lg"
      className={cn(
        "group relative transition-colors duration-150",
        "hover:border-ns-border-strong hover:bg-ns-muted/60",
        className,
      )}
    >
      {/*
        카드 본문 클릭 → Manuscript.
        수정/삭제는 Link 밖에 두어 이동과 분리한다.
      */}
      <Link
        href={href}
        className="block min-w-0 pr-ns-24 outline-none focus-visible:shadow-[var(--ns-ring-accent)] rounded-ns-md"
      >
        <div className="flex flex-wrap items-center gap-ns-2">
          <span className="rounded-ns-full bg-ns-accent-soft px-ns-3 py-ns-1 text-ns-xs font-medium text-ns-accent">
            {kindLabel}
          </span>
          <span className="text-ns-xs text-ns-ink-tertiary">#{number}</span>
        </div>

        <h2 className="mt-ns-3 text-ns-xl font-semibold leading-ns-snug tracking-tight text-ns-ink">
          {document.title}
        </h2>

        {document.summary ? (
          <p className="mt-ns-2 line-clamp-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {document.summary}
          </p>
        ) : null}

        <dl className="mt-ns-4 flex flex-wrap gap-x-ns-4 gap-y-ns-1 text-ns-xs text-ns-ink-tertiary">
          <div className="flex gap-ns-1">
            <dt>생성</dt>
            <dd>{formatShortDate(document.createdAt)}</dd>
          </div>
          <div className="flex gap-ns-1">
            <dt>수정</dt>
            <dd>{formatShortDate(document.updatedAt)}</dd>
          </div>
        </dl>
      </Link>

      <div className="absolute right-ns-5 top-ns-5 flex items-center gap-ns-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${document.title} 수정`}
          onClick={() => onEdit(document)}
        >
          수정
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          aria-label={`${document.title} 삭제`}
          onClick={() => onDelete(document)}
        >
          삭제
        </Button>
      </div>
    </Card>
  );
}
