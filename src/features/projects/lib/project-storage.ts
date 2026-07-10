/**
 * =============================================================================
 * Project Storage (Cloud 우선 + LocalStorage 백업)
 * -----------------------------------------------------------------------------
 * 온라인·로그인 시 Supabase `projects` 테이블을 사용한다.
 * LocalStorage는 오프라인 백업용으로만 유지한다.
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import type { ProjectId } from "@/types/ids";
import { canUseCloudDb } from "@/database/supabase/cloud-mode";
import {
  cloudDeleteProject,
  cloudListProjects,
  cloudUpsertProject,
} from "@/database/supabase/projects-repo";
import { PROJECTS_STORAGE_KEY } from "@/lib/storage/keys";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { PROJECTS_STORAGE_KEY };

export interface ProjectInput {
  title: string;
  description: string;
}

/** LocalStorage 백업 읽기 */
function readLocalProjects(): Project[] {
  return readJsonArray<Project>(PROJECTS_STORAGE_KEY);
}

/** LocalStorage 백업 쓰기 */
function writeLocalProjects(projects: Project[]): void {
  const sorted = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
  writeJsonArray(PROJECTS_STORAGE_KEY, sorted);
}

export function createProjectId(): ProjectId {
  return crypto.randomUUID();
}

export async function readProjects(): Promise<Project[]> {
  if (await canUseCloudDb()) {
    try {
      const projects = await cloudListProjects();
      writeLocalProjects(projects);
      return projects;
    } catch {
      return readLocalProjects();
    }
  }
  return readLocalProjects();
}

export async function createProject(input: ProjectInput): Promise<Project> {
  let existing = readLocalProjects();
  if (await canUseCloudDb()) {
    try {
      existing = await cloudListProjects();
    } catch {
      // 로컬 백업 기준
    }
  }

  const timestamp = nowIso();
  const minSort = existing.reduce(
    (min, project) => Math.min(min, project.sortOrder),
    0,
  );

  const project: Project = {
    id: createProjectId(),
    title: input.title.trim(),
    premise: input.description.trim() || undefined,
    status: "ideation",
    sortOrder: minSort - 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertProject(project);
      const projects = await cloudListProjects();
      writeLocalProjects(projects);
      return project;
    } catch {
      // 클라우드 실패 시 로컬 백업만
    }
  }

  writeLocalProjects([project, ...existing]);
  return project;
}

export async function updateProject(
  id: ProjectId,
  input: ProjectInput,
): Promise<Project | null> {
  const projects = await readProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;

  const updated: Project = {
    ...projects[index],
    title: input.title.trim(),
    premise: input.description.trim() || undefined,
    updatedAt: nowIso(),
  };

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertProject(updated);
      const next = await cloudListProjects();
      writeLocalProjects(next);
      return updated;
    } catch {
      // fall through to local
    }
  }

  const next = [...projects];
  next[index] = updated;
  writeLocalProjects(next);
  return updated;
}

export async function deleteProject(id: ProjectId): Promise<boolean> {
  const projects = await readProjects();
  const exists = projects.some((project) => project.id === id);
  if (!exists) return false;

  if (await canUseCloudDb()) {
    try {
      await cloudDeleteProject(id);
      const next = await cloudListProjects();
      writeLocalProjects(next);
      return true;
    } catch {
      // fall through
    }
  }

  writeLocalProjects(projects.filter((project) => project.id !== id));
  return true;
}

export async function getProjectById(id: ProjectId): Promise<Project | null> {
  const projects = await readProjects();
  return projects.find((project) => project.id === id) ?? null;
}
