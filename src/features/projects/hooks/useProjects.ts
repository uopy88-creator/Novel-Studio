"use client";

/**
 * =============================================================================
 * useProjects
 * -----------------------------------------------------------------------------
 * 작품 목록 상태 + LocalStorage CRUD를 화면에 연결하는 훅.
 *
 * - 마운트 후에만 storage를 읽어 hydration mismatch를 피한다.
 * - 모든 변경은 storage에 쓴 뒤 state를 갱신한다.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/features/projects/types/project";
import type { ProjectId } from "@/types/ids";
import {
  createProject,
  deleteProject,
  readProjects,
  updateProject,
  type ProjectInput,
} from "@/features/projects/lib/project-storage";

export interface UseProjectsResult {
  /** 작품 목록 (sortOrder 정렬됨) */
  projects: Project[];
  /** LocalStorage 첫 로드가 끝났는지 */
  isReady: boolean;
  create: (input: ProjectInput) => Project;
  update: (id: ProjectId, input: ProjectInput) => Project | null;
  remove: (id: ProjectId) => boolean;
  /** storage에서 다시 읽기 */
  refresh: () => void;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setProjects(readProjects());
  }, []);

  useEffect(() => {
    refresh();
    setIsReady(true);
  }, [refresh]);

  const create = useCallback((input: ProjectInput) => {
    const project = createProject(input);
    setProjects(readProjects());
    return project;
  }, []);

  const update = useCallback((id: ProjectId, input: ProjectInput) => {
    const project = updateProject(id, input);
    setProjects(readProjects());
    return project;
  }, []);

  const remove = useCallback((id: ProjectId) => {
    const ok = deleteProject(id);
    setProjects(readProjects());
    return ok;
  }, []);

  return { projects, isReady, create, update, remove, refresh };
}
