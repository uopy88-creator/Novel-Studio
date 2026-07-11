"use client";

/**
 * =============================================================================
 * useProjects
 * -----------------------------------------------------------------------------
 * 작품 목록 — Supabase Database 단일 소스 (설정 시).
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
  projects: Project[];
  isReady: boolean;
  create: (input: ProjectInput) => Promise<Project>;
  update: (id: ProjectId, input: ProjectInput) => Promise<Project | null>;
  remove: (id: ProjectId) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setProjects(await readProjects());
    } catch (error) {
      console.error("[useProjects] 작품 목록을 불러오지 못했습니다.", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const create = useCallback(async (input: ProjectInput) => {
    const project = await createProject(input);
    setProjects(await readProjects());
    return project;
  }, []);

  const update = useCallback(async (id: ProjectId, input: ProjectInput) => {
    const project = await updateProject(id, input);
    setProjects(await readProjects());
    return project;
  }, []);

  const remove = useCallback(async (id: ProjectId) => {
    const ok = await deleteProject(id);
    setProjects(await readProjects());
    return ok;
  }, []);

  return { projects, isReady, create, update, remove, refresh };
}
