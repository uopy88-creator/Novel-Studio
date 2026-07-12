/**
 * section_metas 리포지토리 (DB 테이블: scenes)
 * -----------------------------------------------------------------------------
 * Section 메타 CRUD.
 *
 * 스키마 호환
 * - 기본 컬럼(항상 존재): scene_number, status, memo, is_collapsed …
 * - 확장 컬럼(마이그레이션 후): section_number, icons
 *
 * 원격 DB에 확장 컬럼이 아직 없어도 저장이 실패하지 않도록
 * upsert 시 한 번 재시도(레거시 행)한다.
 */

import type {
  SectionIcons,
  SectionMeta,
  SectionStatus,
} from "@/features/manuscript/types/section";
import { EMPTY_SECTION_ICONS } from "@/features/manuscript/types/section";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { DB_TABLES, type DbSectionMetaRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { nowIso } from "@/lib/storage/browser";

/**
 * 확장 컬럼(section_number / icons) 사용 가능 여부.
 * null = 아직 모름, true = 사용, false = 레거시만.
 */
let scenesExtendedSchema: boolean | null = null;

/** icons jsonb → SectionIcons (컬럼 없거나 null 이면 기본값) */
function iconsFromRow(raw: unknown): SectionIcons {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SECTION_ICONS };
  }
  const o = raw as Record<string, unknown>;
  return {
    important: Boolean(o.important),
    foreshadowing: Boolean(o.foreshadowing),
    dialogue: Boolean(o.dialogue),
  };
}

/** PostgREST / Postgres “컬럼 없음” 오류인지 */
export function isMissingScenesColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; details?: string };
  const code = String(e.code ?? "");
  const message = `${e.message ?? ""} ${e.details ?? ""}`;
  if (code === "42703" || code === "PGRST204") return true;
  return /column .* does not exist/i.test(message) ||
    /Could not find the '.*' column/i.test(message);
}

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
    icons: iconsFromRow(row.icons ?? null),
    isCollapsed: Boolean(row.is_collapsed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 확장 스키마 행 (section_number + icons 포함) */
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
    icons: meta.icons ?? { ...EMPTY_SECTION_ICONS },
    is_collapsed: meta.isCollapsed,
    created_at: meta.createdAt,
    updated_at: meta.updatedAt,
  };
}

/**
 * 레거시 스키마 행 — init 테이블에만 있는 컬럼.
 * section_number / icons 를 넣으면 미적용 마이그레이션 환경에서 upsert 가 실패한다.
 */
function metaToLegacyRow(
  meta: SectionMeta,
  userId: string,
): Omit<DbSectionMetaRow, "section_number" | "icons"> {
  return {
    id: meta.id,
    user_id: userId,
    project_id: meta.projectId,
    document_id: meta.documentId,
    scene_number: meta.sectionNumber,
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

  // section_number 는 마이그레이션 전엔 없을 수 있음 → scene_number 만 조회
  const { data: existing, error: listError } = await client
    .from(DB_TABLES.section_metas)
    .select("id, scene_number")
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (listError) throw listError;

  const keepNumbers = new Set(metas.map((m) => m.sectionNumber));
  const toDelete = (existing ?? [])
    .filter((row) => {
      const n = row.scene_number as number | null;
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

  const stamped = metas.map((meta) => ({ ...meta, updatedAt: nowIso() }));

  // 확장 스키마를 쓰거나, 아직 모르면 먼저 확장 행으로 시도
  if (scenesExtendedSchema !== false) {
    const rows = stamped.map((meta) => metaToRow(meta, userId));
    const { error } = await client.from(DB_TABLES.section_metas).upsert(rows);
    if (!error) {
      scenesExtendedSchema = true;
      return;
    }
    if (!isMissingScenesColumnError(error)) throw error;
    // 컬럼 없음 → 이후부터 레거시 경로
    scenesExtendedSchema = false;
    console.warn(
      "[section-metas-repo] scenes 확장 컬럼(section_number/icons) 없음 — 레거시 upsert 로 저장합니다. 마이그레이션 20260712000002 / 20260712000004 를 적용하세요.",
    );
  }

  const legacyRows = stamped.map((meta) => metaToLegacyRow(meta, userId));
  const { error: legacyError } = await client
    .from(DB_TABLES.section_metas)
    .upsert(legacyRows);
  if (legacyError) throw legacyError;
}

/** @deprecated */
export const cloudListSceneMetasByDocument = cloudListSectionMetasByDocument;
/** @deprecated */
export const cloudReplaceSceneMetas = cloudReplaceSectionMetas;
