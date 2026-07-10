/**
 * =============================================================================
 * dialogues 테이블 리포지토리
 * =============================================================================
 */

import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { dialogueToRow, rowToDialogue } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListDialogues(): Promise<Dialogue[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.dialogues)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map(rowToDialogue);
}

export async function cloudListDialoguesByProject(
  projectId: string,
): Promise<Dialogue[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.dialogues)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []).map(rowToDialogue);
}

export async function cloudUpsertDialogue(dialogue: Dialogue): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = dialogueToRow(dialogue, userId);

  const { error } = await client.from(DB_TABLES.dialogues).upsert(row);
  if (error) throw error;
}

export async function cloudDeleteDialogue(dialogueId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.dialogues)
    .delete()
    .eq("id", dialogueId)
    .eq("user_id", userId);

  if (error) throw error;
}
