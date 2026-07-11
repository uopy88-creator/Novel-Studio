/**
 * =============================================================================
 * manuscript_versions 테이블 리포지토리
 * =============================================================================
 */

import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  manuscriptVersionToRow,
  rowToManuscriptVersion,
} from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListManuscriptVersions(
  projectId: string,
  documentId: string,
): Promise<ManuscriptVersion[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.manuscript_versions)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToManuscriptVersion);
}

export async function cloudInsertManuscriptVersion(
  version: ManuscriptVersion,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = manuscriptVersionToRow(version, userId);

  const { error } = await client
    .from(DB_TABLES.manuscript_versions)
    .insert(row);
  if (error) throw error;
}

export async function cloudUpdateManuscriptVersionName(
  versionId: string,
  name: string,
  updatedAt: string,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.manuscript_versions)
    .update({ name, updated_at: updatedAt })
    .eq("id", versionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function cloudGetManuscriptVersion(
  versionId: string,
): Promise<ManuscriptVersion | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.manuscript_versions)
    .select("*")
    .eq("id", versionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToManuscriptVersion(data) : null;
}
