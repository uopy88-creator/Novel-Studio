/**
 * =============================================================================
 * trash_items Repository
 * =============================================================================
 */

import type { TrashItem } from "@/features/trash/types/trash-item";
import type { TrashEntityType } from "@/features/trash/types/trash-item";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

interface TrashRow {
  id: string;
  user_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  deleted_at: string;
  expires_at: string;
  payload: unknown;
}

function rowToItem(row: TrashRow): TrashItem {
  return {
    id: row.id,
    projectId: row.project_id,
    entityType: row.entity_type as TrashEntityType,
    entityId: row.entity_id,
    name: row.name,
    deletedAt: row.deleted_at,
    expiresAt: row.expires_at,
    payload: row.payload,
  };
}

function itemToRow(item: TrashItem, userId: string): TrashRow {
  return {
    id: item.id,
    user_id: userId,
    project_id: item.projectId,
    entity_type: item.entityType,
    entity_id: item.entityId,
    name: item.name,
    deleted_at: item.deletedAt,
    expires_at: item.expiresAt,
    payload: item.payload,
  };
}

export async function cloudListTrashByProject(
  projectId: string,
): Promise<TrashItem[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.trash_items)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToItem(row as TrashRow));
}

export async function cloudGetTrashItem(
  trashId: string,
): Promise<TrashItem | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.trash_items)
    .select("*")
    .eq("user_id", userId)
    .eq("id", trashId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToItem(data as TrashRow);
}

export async function cloudUpsertTrashItem(item: TrashItem): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = itemToRow(item, userId);

  const { error } = await client.from(DB_TABLES.trash_items).upsert(row);
  if (error) throw error;
}

export async function cloudDeleteTrashItem(trashId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.trash_items)
    .delete()
    .eq("id", trashId)
    .eq("user_id", userId);

  if (error) throw error;
}
