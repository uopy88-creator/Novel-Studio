"use client";

/**
 * =============================================================================
 * ProjectCard
 * -----------------------------------------------------------------------------
 * 작품 목록의 한 장.
 * - 카드 클릭 → 작품 작업실(지금은 Dashboard 준비 중)로 이동
 * - 수정/삭제는 카드 안 버튼으로 처리 (클릭 전파 중단)
 * =============================================================================
 */

import Link from "next/link";
import type { Project } from "@/features/projects/types/project";
import {
  DEFAULT_PROJECT_TYPE,
  PROJECT_TYPE_LABELS,
} from "@/features/projects/types/project";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface ProjectCardProps {
  project: Project;
  /** 수정 모달 열기 */
  onEdit: (project: Project) => void;
  /** 삭제 요청 */
  onDelete: (project: Project) => void;
  className?: string;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  className,
}: ProjectCardProps) {
  const href = `/projects/${project.id}/dashboard`;
  const typeLabel =
    PROJECT_TYPE_LABELS[project.type ?? DEFAULT_PROJECT_TYPE] ?? "소설";

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
        카드 전체 클릭 영역.
        수정/삭제 버튼은 이 Link 밖에 두어 의도치 않은 이동을 막는다.
      */}
      <Link
        href={href}
        className="block min-w-0 pr-ns-16 outline-none focus-visible:shadow-[var(--ns-ring-accent)] rounded-ns-md"
      >
        <h2 className="text-ns-xl font-semibold leading-ns-snug tracking-tight text-ns-ink">
          {project.title}
        </h2>
        <span
          className={cn(
            "mt-ns-2 inline-flex items-center rounded-ns-md border border-ns-border",
            "bg-ns-muted/70 px-ns-2 py-0.5 text-ns-xs text-ns-ink-secondary",
          )}
        >
          {typeLabel}
        </span>
        {project.premise ? (
          <p className="mt-ns-2 line-clamp-2 text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
            {project.premise}
          </p>
        ) : (
          <p className="mt-ns-2 text-ns-sm text-ns-ink-tertiary">설명 없음</p>
        )}
      </Link>

      <div className="absolute right-ns-5 top-ns-5 flex items-center gap-ns-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${project.title} 수정`}
          title="수정"
          onClick={() => onEdit(project)}
          className="min-w-9 px-ns-2"
        >
          ✏️
        </Button>
        <Button
          type="button"
          variant="danger-ghost"
          size="sm"
          aria-label={`${project.title} 삭제`}
          title="삭제"
          onClick={() => onDelete(project)}
          className="min-w-9 px-ns-2"
        >
          🗑
        </Button>
      </div>
    </Card>
  );
}
