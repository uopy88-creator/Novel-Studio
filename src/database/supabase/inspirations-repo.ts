/**
 * =============================================================================
 * inspirations 테이블 리포지토리
 * =============================================================================
 */

import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { inspirationToRow, rowToInspiration } from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbInspirationRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function isMissingInspirationColumnError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  return (
    code === "PGRST204" ||
    /['"]section_stable_id['"]/.test(message) ||
    (message.includes("schema cache") && message.includes("section_stable_id"))
  );
}

function inspirationToBaseRow(
  inspiration: Inspiration,
  userId: string,
): DbInspirationRow {
  return {
    id: inspiration.id,
    project_id: inspiration.projectId,
    document_id: inspiration.documentId,
    user_id: userId,
    selected_text: inspiration.selectedText,
    work_title: inspiration.workTitle,
    author: inspiration.author,
    memo: inspiration.memo,
    start_offset: inspiration.startOffset,
    end_offset: inspiration.endOffset,
    created_at: inspiration.createdAt,
    updated_at: inspiration.updatedAt,
  };
}

export async function cloudListInspirations(): Promise<Inspiration[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.inspirations)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
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

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToInspiration);
}

export async function cloudUpsertInspiration(
  inspiration: Inspiration,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = inspirationToRow(inspiration, userId);

  const first = await client.from(DB_TABLES.inspirations).upsert(row);
  if (!first.error) return;

  if (isMissingInspirationColumnError(first.error)) {
    const retry = await client
      .from(DB_TABLES.inspirations)
      .upsert(inspirationToBaseRow(inspiration, userId));
    if (!retry.error) return;
    throw toCloudError(retry.error, "Inspiration 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "Inspiration 저장에 실패했습니다.");
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

  if (error) throw toCloudError(error, "Inspiration 삭제에 실패했습니다.");
}
