/**
 * scene_metas 리포지토리
 */

import type { SceneMeta, SceneStatus } from "@/features/manuscript/types/scene";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { DB_TABLES, type DbSceneMetaRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { nowIso } from "@/lib/storage/browser";

function rowToMeta(row: DbSceneMetaRow): SceneMeta {
  const status = (["draft", "editing", "done"] as SceneStatus[]).includes(
    row.status as SceneStatus,
  )
    ? (row.status as SceneStatus)
    : "draft";

  return {
    id: row.id,
    projectId: row.project_id,
    documentId: row.document_id,
    sceneNumber: row.scene_number,
    status,
    memo: row.memo ?? "",
    isCollapsed: Boolean(row.is_collapsed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function metaToRow(meta: SceneMeta, userId: string): DbSceneMetaRow {
  return {
    id: meta.id,
    user_id: userId,
    project_id: meta.projectId,
    document_id: meta.documentId,
    scene_number: meta.sceneNumber,
    status: meta.status,
    memo: meta.memo,
    is_collapsed: meta.isCollapsed,
    created_at: meta.createdAt,
    updated_at: meta.updatedAt,
  };
}

export async function cloudListSceneMetasByDocument(
  documentId: string,
): Promise<SceneMeta[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.scene_metas)
    .select("*")
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw error;
  return (data ?? []).map((row) => rowToMeta(row as DbSceneMetaRow));
}

/** 문서의 Scene 메타를 통째로 교체(upsert) */
export async function cloudReplaceSceneMetas(
  metas: SceneMeta[],
): Promise<void> {
  if (metas.length === 0) return;

  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const documentId = metas[0].documentId;

  // 기존 번호 중 사라진 것 삭제
  const { data: existing, error: listError } = await client
    .from(DB_TABLES.scene_metas)
    .select("id, scene_number")
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (listError) throw listError;

  const keepNumbers = new Set(metas.map((m) => m.sceneNumber));
  const toDelete = (existing ?? [])
    .filter((row) => !keepNumbers.has(row.scene_number as number))
    .map((row) => row.id as string);

  if (toDelete.length > 0) {
    const { error: delError } = await client
      .from(DB_TABLES.scene_metas)
      .delete()
      .in("id", toDelete)
      .eq("user_id", userId);
    if (delError) throw delError;
  }

  const rows = metas.map((meta) =>
    metaToRow({ ...meta, updatedAt: nowIso() }, userId),
  );

  const { error } = await client.from(DB_TABLES.scene_metas).upsert(rows);
  if (error) throw error;
}
