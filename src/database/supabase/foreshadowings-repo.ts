/**
 * foreshadowings 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  foreshadowingToRow,
  rowToForeshadowing,
} from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbForeshadowingRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function isMissingForeshadowingColumnError(error: unknown): boolean {
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
    /['"]planted_section_stable_id['"]/.test(message) ||
    /['"]payoff_section_stable_id['"]/.test(message) ||
    (message.includes("schema cache") &&
      (message.includes("section_stable_id") ||
        message.includes("planted_section") ||
        message.includes("payoff_section")))
  );
}

function foreshadowingToBaseRow(
  item: Foreshadowing,
  userId: string,
): DbForeshadowingRow {
  return {
    id: item.id,
    project_id: item.projectId,
    user_id: userId,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    planted_document_id: item.plantedChapterId ?? null,
    payoff_document_id: item.payoffChapterId ?? null,
    related_character_ids: item.relatedCharacterIds ?? [],
    importance: item.importance,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export async function cloudListForeshadowings(): Promise<Foreshadowing[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.foreshadowings)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
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

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToForeshadowing);
}

export async function cloudUpsertForeshadowing(
  item: Foreshadowing,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = foreshadowingToRow(item, userId);

  const first = await client.from(DB_TABLES.foreshadowings).upsert(row);
  if (!first.error) return;

  if (isMissingForeshadowingColumnError(first.error)) {
    const retry = await client
      .from(DB_TABLES.foreshadowings)
      .upsert(foreshadowingToBaseRow(item, userId));
    if (!retry.error) return;
    throw toCloudError(retry.error, "복선 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "복선 저장에 실패했습니다.");
}

export async function cloudDeleteForeshadowing(itemId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.foreshadowings)
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error, "복선 삭제에 실패했습니다.");
}
