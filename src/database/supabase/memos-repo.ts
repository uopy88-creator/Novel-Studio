/**
 * memos 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { Memo } from "@/features/memo/types/memo";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { memoToRow, rowToMemo } from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbMemoRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function isMissingMemoColumnError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");
  return (
    message.includes("source_text") ||
    message.includes("section_stable_id") ||
    message.includes("schema cache")
  );
}

/** 후속 마이그레이션 컬럼을 제외한 기본 행 (미적용 DB 호환) */
function memoToBaseRow(memo: Memo, userId: string): DbMemoRow {
  return {
    id: memo.id,
    project_id: memo.projectId,
    user_id: userId,
    body: memo.body,
    kind: memo.kind,
    is_pinned: memo.isPinned,
    is_resolved: memo.isResolved,
    document_id: memo.chapterId ?? null,
    character_id: memo.characterId ?? null,
    foreshadowing_id: memo.foreshadowingId ?? null,
    tags: memo.tags ?? [],
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  };
}

export async function cloudListMemos(): Promise<Memo[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.memos)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
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

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToMemo);
}

export async function cloudUpsertMemo(memo: Memo): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = memoToRow(memo, userId);

  const first = await client.from(DB_TABLES.memos).upsert(row);
  if (!first.error) return;

  // 선택 컬럼 미적용 DB: 기본 컬럼만으로 재시도 (본문·Pin 은 저장)
  if (isMissingMemoColumnError(first.error)) {
    const retry = await client
      .from(DB_TABLES.memos)
      .upsert(memoToBaseRow(memo, userId));
    if (!retry.error) return;
    throw toCloudError(retry.error, "Memo 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "Memo 저장에 실패했습니다.");
}

export async function cloudDeleteMemo(memoId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.memos)
    .delete()
    .eq("id", memoId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error, "Memo 삭제에 실패했습니다.");
}
