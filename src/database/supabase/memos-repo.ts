/**
 * memos 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { Memo } from "@/features/memo/types/memo";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { memoToRow, rowToMemo } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListMemos(): Promise<Memo[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.memos)
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map(rowToMemo);
}

export async function cloudListMemosByProject(
  projectId: string,
): Promise<Memo[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.memos)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) throw error;
  return (data ?? []).map(rowToMemo);
}

export async function cloudUpsertMemo(memo: Memo): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const { error } = await client
    .from(DB_TABLES.memos)
    .upsert(memoToRow(memo, userId));
  if (error) throw error;
}

export async function cloudDeleteMemo(memoId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.memos)
    .delete()
    .eq("id", memoId)
    .eq("user_id", userId);

  if (error) throw error;
}
