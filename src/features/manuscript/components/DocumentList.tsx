"use client";

/**
 * =============================================================================
 * DocumentList
 * -----------------------------------------------------------------------------
 * Document 카드를 순서대로 나열한다.
 * =============================================================================
 */

import type { ReactNode } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import { DocumentCard } from "@/features/manuscript/components/DocumentCard";
import { cn } from "@/lib/utils/cn";

export interface DocumentListProps {
  documents: Chapter[];
  projectId: string;
  onEdit: (document: Chapter) => void;
  onDelete: (document: Chapter) => void;
  emptyAction?: ReactNode;
  className?: string;
}

export function DocumentList({
  documents,
  projectId,
  onEdit,
  onDelete,
  emptyAction,
  className,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-16 text-center",
          className,
        )}
      >
        <p className="text-ns-lg font-medium text-ns-ink">
          아직 Document가 없습니다
        </p>
        <p className="mt-ns-2 max-w-sm text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
          새 문서를 만들면 이곳에 카드로 나타납니다. 카드를 누르면 원고
          화면으로 이동합니다.
        </p>
        {emptyAction ? <div className="mt-ns-6">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-ns-4", className)}>
      {documents.map((document, index) => (
        <li key={document.id}>
          <DocumentCard
            document={document}
            projectId={projectId}
            number={index + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
