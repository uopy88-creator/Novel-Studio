/**
 * =============================================================================
 * projects 테이블 리포지토리
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { projectToRow, rowToProject } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListProjects(): Promise<Project[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.projects)
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function cloudUpsertProject(project: Project): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = projectToRow(project, userId);

  const { error } = await client.from(DB_TABLES.projects).upsert(row);
  if (error) throw error;
}

export async function cloudDeleteProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
}
