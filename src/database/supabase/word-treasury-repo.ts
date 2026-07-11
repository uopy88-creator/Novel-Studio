/**
 * word_treasury 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { WordTreasuryEntry } from "@/features/word-treasury/types/word-treasury";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  rowToWordTreasury,
  wordTreasuryToRow,
} from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListWordTreasury(): Promise<WordTreasuryEntry[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.word_treasury)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map(rowToWordTreasury);
}

export async function cloudListWordTreasuryByProject(
  projectId: string,
): Promise<WordTreasuryEntry[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.word_treasury)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []).map(rowToWordTreasury);
}

export async function cloudUpsertWordTreasury(
  entry: WordTreasuryEntry,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const { error } = await client
    .from(DB_TABLES.word_treasury)
    .upsert(wordTreasuryToRow(entry, userId));
  if (error) throw error;
}

export async function cloudDeleteWordTreasury(entryId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.word_treasury)
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw error;
}
