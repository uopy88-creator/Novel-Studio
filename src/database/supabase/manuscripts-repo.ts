/**
 * =============================================================================
 * manuscripts 테이블 리포지토리
 * =============================================================================
 */

import type { Manuscript } from "@/features/manuscript/types/manuscript";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { manuscriptToRow, rowToManuscript } from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListManuscripts(): Promise<Manuscript[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.manuscripts)
    .select("*")
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToManuscript);
}

/**
 * Document 원고 조회.
 * - Manuscript 반환: 행 존재 (content 는 "" 일 수 있음 = 실제 빈 원고)
 * - null 반환: 행 없음 (아직 저장된 적 없음) — "" 와 다름
 * - throw: DB/네트워크 조회 실패
 */
export async function cloudGetManuscriptByDocumentId(
  projectId: string,
  documentId: string,
): Promise<Manuscript | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.manuscripts)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) throw toCloudError(error);
  return data ? rowToManuscript(data) : null;
}

export async function cloudUpsertManuscript(
  manuscript: Manuscript,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = manuscriptToRow(manuscript, userId);

  const { error } = await client.from(DB_TABLES.manuscripts).upsert(row);
  if (error) throw toCloudError(error);
}
