/**
 * foreshadowings 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  foreshadowingToRow,
  rowToForeshadowing,
} from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListForeshadowings(): Promise<Foreshadowing[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.foreshadowings)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map(rowToForeshadowing);
}

export async function cloudListForeshadowingsByProject(
  projectId: string,
): Promise<Foreshadowing[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.foreshadowings)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []).map(rowToForeshadowing);
}

export async function cloudUpsertForeshadowing(
  item: Foreshadowing,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const { error } = await client
    .from(DB_TABLES.foreshadowings)
    .upsert(foreshadowingToRow(item, userId));
  if (error) throw error;
}

export async function cloudDeleteForeshadowing(itemId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.foreshadowings)
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw error;
}
