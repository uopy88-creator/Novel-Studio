/**
 * =============================================================================
 * Project Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type { Project, ProjectType } from "@/features/projects/types/project";
import {
  DEFAULT_PROJECT_TYPE,
  isProjectType,
} from "@/features/projects/types/project";
import type { ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteProject,
  cloudGetProjectById,
  cloudHideProject,
  cloudListProjects,
  cloudUnhideProject,
  cloudUpsertProject,
} from "@/database/supabase/projects-repo";
import { purgeLocalProjectData } from "@/features/projects/lib/purge-project-data";
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
  /** 작품 종류 — 기본값 novel */
  type?: ProjectType;
}

/** type 없는 레거시 로컬 데이터를 novel 로 정규화 */
function normalizeProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Project>;
  if (typeof item.id !== "string" || typeof item.title !== "string") {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    premise: item.premise,
    type: isProjectType(item.type) ? item.type : DEFAULT_PROJECT_TYPE,
    status: item.status ?? "ideation",
    targetWordCount: item.targetWordCount,
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocalProjects(): Project[] {
  return readJsonArray<unknown>(PROJECTS_STORAGE_KEY)
    .map(normalizeProject)
    .filter((item): item is Project => item !== null);
}

function writeLocalProjects(projects: Project[]): void {
  const sorted = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
  writeJsonArray(PROJECTS_STORAGE_KEY, sorted);
}

function backupProjects(projects: Project[]): void {
  writeWorkDataBackup(PROJECTS_STORAGE_KEY, projects);
}

function resolveType(input: ProjectInput, fallback?: ProjectType): ProjectType {
  if (isProjectType(input.type)) return input.type;
  return fallback ?? DEFAULT_PROJECT_TYPE;
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
  const type = resolveType(input);

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
      type,
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
    type,
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

    const current = projects[index];
    const updated: Project = {
      ...current,
      title: input.title.trim(),
      premise: input.description.trim() || undefined,
      type: resolveType(input, current.type),
      updatedAt: nowIso(),
    };
    await cloudUpsertProject(updated);
    backupProjects(await cloudListProjects());
    return updated;
  }

  const projects = readLocalProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;
  const current = projects[index];
  const updated: Project = {
    ...current,
    title: input.title.trim(),
    premise: input.description.trim() || undefined,
    type: resolveType(input, current.type),
    updatedAt: nowIso(),
  };
  const next = [...projects];
  next[index] = updated;
  writeLocalProjects(next);
  return updated;
}

export async function getProjectById(id: ProjectId): Promise<Project | null> {
  const projects = await readProjects();
  return projects.find((project) => project.id === id) ?? null;
}

/**
 * Soft Delete — 휴지통 이동.
 * removeLive 는 hideProject (자식 CASCADE 없음).
 */
export async function deleteProject(id: ProjectId): Promise<boolean> {
  const { softDelete } = await import("@/features/trash/lib/trash-manager");
  return softDelete("project", id);
}

/**
 * Soft-hide — 활성 목록에서만 제거. 자식 데이터는 유지.
 * - Cloud: deleted_at 설정 (DELETE CASCADE 회피)
 * - Local: projects 배열에서만 제거
 */
export async function hideProject(id: ProjectId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudGetProjectById(id);
    if (!existing) return false;
    await cloudHideProject(id);
    backupProjects(await cloudListProjects());
    return true;
  }

  const projects = readLocalProjects();
  if (!projects.some((project) => project.id === id)) return false;
  writeLocalProjects(projects.filter((project) => project.id !== id));
  return true;
}

/**
 * 영구삭제 — projects 행 DELETE + 로컬 cascade purge.
 * Soft Delete 경로에서는 호출하지 않는다 (permanentDelete 전용).
 */
export async function purgeProject(id: ProjectId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudGetProjectById(id);
    if (!existing) {
      // 이미 없더라도 로컬 잔여 정리
      purgeLocalProjectData(id);
      const { clearTrashForProject } = await import(
        "@/features/trash/lib/trash-storage"
      );
      await clearTrashForProject(id);
      return false;
    }
    await cloudDeleteProject(id);
    purgeLocalProjectData(id);
    const { clearTrashForProject } = await import(
      "@/features/trash/lib/trash-storage"
    );
    await clearTrashForProject(id);
    backupProjects(await cloudListProjects());
    return true;
  }

  const projects = readLocalProjects();
  const existed = projects.some((project) => project.id === id);
  if (existed) {
    writeLocalProjects(projects.filter((project) => project.id !== id));
  }
  purgeLocalProjectData(id);
  const { clearTrashForProject } = await import(
    "@/features/trash/lib/trash-storage"
  );
  await clearTrashForProject(id);
  return existed;
}

export async function restoreProjectFromTrash(
  payload: unknown,
): Promise<boolean> {
  const project = normalizeProject(payload);
  if (!project) return false;

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    // 행이 soft-hide 상태면 unhide, 없으면 upsert
    const existing = await cloudGetProjectById(project.id);
    if (existing) {
      await cloudUnhideProject(project.id);
      await cloudUpsertProject(project);
    } else {
      await cloudUpsertProject(project);
    }
    backupProjects(await cloudListProjects());
    return true;
  }

  const others = readLocalProjects().filter((p) => p.id !== project.id);
  writeLocalProjects([...others, project]);
  return true;
}
