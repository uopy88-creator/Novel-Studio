/**
 * =============================================================================
 * inspirations 테이블 리포지토리
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { inspirationToRow, rowToInspiration } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListInspirations(): Promise<Inspiration[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.inspirations)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map(rowToInspiration);
}

export async function cloudListInspirationsByProject(
  projectId: string,
): Promise<Inspiration[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.inspirations)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []).map(rowToInspiration);
}

export async function cloudUpsertInspiration(
  inspiration: Inspiration,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = inspirationToRow(inspiration, userId);

  const { error } = await client.from(DB_TABLES.inspirations).upsert(row);
  if (error) throw error;
}

export async function cloudDeleteInspiration(
  inspirationId: string,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.inspirations)
    .delete()
    .eq("id", inspirationId)
    .eq("user_id", userId);

  if (error) throw error;
}
