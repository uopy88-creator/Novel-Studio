/**
 * =============================================================================
 * projects 테이블 리포지토리
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { projectToRow, rowToProject } from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

/** 활성 작품만 (deleted_at IS NULL) */
export async function cloudListProjects(): Promise<Project[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.projects)
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToProject);
}

/** id 로 조회 — soft-hide 포함 (휴지통 capture 등) */
export async function cloudGetProjectById(
  projectId: string,
): Promise<Project | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.projects)
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw toCloudError(error);
  return data ? rowToProject(data) : null;
}

export async function cloudUpsertProject(project: Project): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = {
    ...projectToRow(project, userId),
    deleted_at: null,
  };

  const { error } = await client.from(DB_TABLES.projects).upsert(row);
  if (error) throw toCloudError(error);
}

/** Soft-hide — 자식 CASCADE 없이 deleted_at 만 설정 */
export async function cloudHideProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
}

/** Soft-hide 해제 */
export async function cloudUnhideProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .update({ deleted_at: null })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
}

export async function cloudDeleteProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
}
