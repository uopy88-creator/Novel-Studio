/**
 * =============================================================================
 * Project LocalStorage
 * -----------------------------------------------------------------------------
 * 작품 데이터의 유일한 저장소 (브라우저 LocalStorage).
 *
 * 왜 화면/훅과 분리하나?
 * - 저장 방식을 나중에 API로 바꿔도 UI는 그대로 둘 수 있다.
 * - SSR 중에는 window가 없으므로, 읽기/쓰기는 클라이언트에서만 호출한다.
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import type { ProjectId } from "@/types/ids";

/** LocalStorage 키 — 다른 기능과 충돌하지 않게 네임스페이스를 둔다 */
export const PROJECTS_STORAGE_KEY = "novel-studio:projects";

/**
 * 새 작품 생성 시 폼에서 받는 값.
 * Project 전체 필드가 아니라, 사용자가 직접 입력하는 것만 담는다.
 */
export interface ProjectInput {
  /** 작품 제목 (필수) */
  title: string;
  /** 작품 설명 → Project.premise 에 저장 */
  description: string;
}

/** 브라우저 환경인지 확인 (Next.js SSR 대비) */
function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * 저장된 작품 목록을 읽는다.
 * 없거나 깨져 있으면 빈 배열을 반환한다.
 */
export function readProjects(): Project[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as Project[];
  } catch {
    return [];
  }
}

/**
 * 작품 목록 전체를 저장한다.
 * sortOrder 기준으로 정렬해 일관된 순서를 유지한다.
 */
export function writeProjects(projects: Project[]): void {
  if (!canUseStorage()) return;

  const sorted = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(sorted));
}

/** 새 ID 생성 */
export function createProjectId(): ProjectId {
  return crypto.randomUUID();
}

/** 현재 시각 ISO 문자열 */
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * 작품 생성.
 * 새 작품은 목록 맨 앞(sortOrder 최소)에 오도록 한다.
 */
export function createProject(input: ProjectInput): Project {
  const projects = readProjects();
  const timestamp = nowIso();
  const minSort = projects.reduce(
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

  writeProjects([project, ...projects]);
  return project;
}

/**
 * 작품 수정 (제목·설명).
 * 없는 id면 null을 반환한다.
 */
export function updateProject(
  id: ProjectId,
  input: ProjectInput,
): Project | null {
  const projects = readProjects();
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
  writeProjects(next);
  return updated;
}

/**
 * 작품 삭제.
 * 삭제되었으면 true.
 */
export function deleteProject(id: ProjectId): boolean {
  const projects = readProjects();
  const next = projects.filter((project) => project.id !== id);
  if (next.length === projects.length) return false;

  writeProjects(next);
  return true;
}

/** id로 단건 조회 */
export function getProjectById(id: ProjectId): Project | null {
  return readProjects().find((project) => project.id === id) ?? null;
}
