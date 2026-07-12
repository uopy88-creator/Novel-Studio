/**
 * section_metas 리포지토리 (DB 테이블: scenes → section_number 컬럼 추가)
 * Section 메타 CRUD. 레거시 scene_number 컬럼과 병행 지원.
 */

import type {
  SectionMeta,
  SectionStatus,
} from "@/features/manuscript/types/section";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { DB_TABLES, type DbSectionMetaRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { nowIso } from "@/lib/storage/browser";

function rowToMeta(row: DbSectionMetaRow): SectionMeta {
  const status = (["draft", "editing", "done"] as SectionStatus[]).includes(
    row.status as SectionStatus,
  )
    ? (row.status as SectionStatus)
    : "draft";

  const sectionNumber =
    typeof row.section_number === "number"
      ? row.section_number
      : typeof row.scene_number === "number"
        ? row.scene_number
        : 1;

  return {
    id: row.id,
    projectId: row.project_id,
    documentId: row.document_id,
    sectionNumber,
    status,
    memo: row.memo ?? "",
    isCollapsed: Boolean(row.is_collapsed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function metaToRow(meta: SectionMeta, userId: string): DbSectionMetaRow {
  return {
    id: meta.id,
    user_id: userId,
    project_id: meta.projectId,
    document_id: meta.documentId,
    scene_number: meta.sectionNumber,
    section_number: meta.sectionNumber,
    status: meta.status,
    memo: meta.memo,
    is_collapsed: meta.isCollapsed,
    created_at: meta.createdAt,
    updated_at: meta.updatedAt,
  };
}

export async function cloudListSectionMetasByDocument(
  documentId: string,
): Promise<SectionMeta[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.section_metas)
    .select("*")
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw error;
  return (data ?? []).map((row) => rowToMeta(row as DbSectionMetaRow));
}

/** 문서의 Section 메타를 통째로 교체(upsert) */
export async function cloudReplaceSectionMetas(
  metas: SectionMeta[],
): Promise<void> {
  if (metas.length === 0) return;

  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const documentId = metas[0].documentId;

  const { data: existing, error: listError } = await client
    .from(DB_TABLES.section_metas)
    .select("id, scene_number, section_number")
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (listError) throw listError;

  const keepNumbers = new Set(metas.map((m) => m.sectionNumber));
  const toDelete = (existing ?? [])
    .filter((row) => {
      const n =
        (row.section_number as number | null) ??
        (row.scene_number as number | null);
      return n === null || !keepNumbers.has(n);
    })
    .map((row) => row.id as string);

  if (toDelete.length > 0) {
    const { error: delError } = await client
      .from(DB_TABLES.section_metas)
      .delete()
      .in("id", toDelete)
      .eq("user_id", userId);
    if (delError) throw delError;
  }

  const rows = metas.map((meta) =>
    metaToRow({ ...meta, updatedAt: nowIso() }, userId),
  );

  const { error } = await client.from(DB_TABLES.section_metas).upsert(rows);
  if (error) throw error;
}

/** @deprecated */
export const cloudListSceneMetasByDocument = cloudListSectionMetasByDocument;
/** @deprecated */
export const cloudReplaceSceneMetas = cloudReplaceSectionMetas;
