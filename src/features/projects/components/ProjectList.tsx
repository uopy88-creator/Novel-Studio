"use client";

/**
 * =============================================================================
 * ProjectList
 * -----------------------------------------------------------------------------
 * 작품 카드들을 세로로 나열한다.
 * 데이터가 없을 때는 빈 상태를 보여 첫 작품 생성을 유도한다.
 * =============================================================================
 */

import type { ReactNode } from "react";
import type { Project } from "@/features/projects/types/project";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { cn } from "@/lib/utils/cn";

export interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  /** 빈 목록일 때 새 작품 버튼 등 */
  emptyAction?: ReactNode;
  className?: string;
}

export function ProjectList({
  projects,
  onEdit,
  onDelete,
  emptyAction,
  className,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-16 text-center",
          className,
        )}
      >
        <p className="text-ns-lg font-medium text-ns-ink">아직 작품이 없습니다</p>
        <p className="mt-ns-2 max-w-sm text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
          새 작품을 만들면 이곳에 목록이 나타납니다.
        </p>
        {emptyAction ? <div className="mt-ns-6">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-ns-4", className)}>
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
