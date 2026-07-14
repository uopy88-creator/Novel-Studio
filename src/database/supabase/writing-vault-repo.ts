/**
 * =============================================================================
 * Writing Vault Repository — 통합 CRUD (유일한 cloud repo)
 * -----------------------------------------------------------------------------
 * 테이블: writing_vault
 * Sentence / Word / Memo / Foreshadowing / Inspiration 공통
 * =============================================================================
 */

import type { WritingVaultEntry } from "@/features/writing-vault/types/writing-vault-entry";
import type { WritingVaultType } from "@/features/writing-vault/types/writing-vault-entry";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  rowToWritingVaultEntry,
  writingVaultEntryToRow,
} from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListWritingVaultEntries(): Promise<
  WritingVaultEntry[]
> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.writing_vault)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
  return (data ?? []).map((row) =>
    rowToWritingVaultEntry(row as Parameters<typeof rowToWritingVaultEntry>[0]),
  );
}

export async function cloudListWritingVaultByProject(
  projectId: string,
  type?: WritingVaultType,
): Promise<WritingVaultEntry[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  let query = client
    .from(DB_TABLES.writing_vault)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (type) {
    query = query.eq("entry_type", type);
  }

  const { data, error } = await query;
  if (error) throw toCloudError(error);
  return (data ?? []).map((row) =>
    rowToWritingVaultEntry(row as Parameters<typeof rowToWritingVaultEntry>[0]),
  );
}

export async function cloudUpsertWritingVaultEntry(
  entry: WritingVaultEntry,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = writingVaultEntryToRow(entry, userId);

  const { error } = await client.from(DB_TABLES.writing_vault).upsert(row);
  if (error) throw toCloudError(error);
}

export async function cloudDeleteWritingVaultEntry(
  entryId: string,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.writing_vault)
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
}
