/**
 * =============================================================================
 * Project Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import type { ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteProject,
  cloudListProjects,
  cloudUpsertProject,
} from "@/database/supabase/projects-repo";
import { PROJECTS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
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

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocalProjects(): Project[] {
  return readJsonArray<Project>(PROJECTS_STORAGE_KEY);
}

function writeLocalProjects(projects: Project[]): void {
  const sorted = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
  writeJsonArray(PROJECTS_STORAGE_KEY, sorted);
}

function backupProjects(projects: Project[]): void {
  writeWorkDataBackup(PROJECTS_STORAGE_KEY, projects);
}

export function createProjectId(): ProjectId {
  return crypto.randomUUID();
}

export async function readProjects(): Promise<Project[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const projects = await cloudListProjects();
    backupProjects(projects);
    return projects;
  }
  return readLocalProjects();
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const timestamp = nowIso();

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudListProjects();
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
    await cloudUpsertProject(project);
    const projects = await cloudListProjects();
    backupProjects(projects);
    return project;
  }

  const existing = readLocalProjects();
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
  writeLocalProjects([project, ...existing]);
  return project;
}

export async function updateProject(
  id: ProjectId,
  input: ProjectInput,
): Promise<Project | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const projects = await cloudListProjects();
    const index = projects.findIndex((project) => project.id === id);
    if (index < 0) return null;

    const updated: Project = {
      ...projects[index],
      title: input.title.trim(),
      premise: input.description.trim() || undefined,
      updatedAt: nowIso(),
    };
    await cloudUpsertProject(updated);
    backupProjects(await cloudListProjects());
    return updated;
  }

  const projects = readLocalProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;
  const updated: Project = {
    ...projects[index],
    title: input.title.trim(),
    premise: input.description.trim() || undefined,
    updatedAt: nowIso(),
  };
  const next = [...projects];
  next[index] = updated;
  writeLocalProjects(next);
  return updated;
}

export async function deleteProject(id: ProjectId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const projects = await cloudListProjects();
    if (!projects.some((project) => project.id === id)) return false;
    await cloudDeleteProject(id);
    backupProjects(await cloudListProjects());
    return true;
  }

  const projects = readLocalProjects();
  if (!projects.some((project) => project.id === id)) return false;
  writeLocalProjects(projects.filter((project) => project.id !== id));
  return true;
}

export async function getProjectById(id: ProjectId): Promise<Project | null> {
  const projects = await readProjects();
  return projects.find((project) => project.id === id) ?? null;
}
