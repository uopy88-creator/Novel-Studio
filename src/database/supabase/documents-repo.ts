/**
 * =============================================================================
 * documents 테이블 리포지토리 (로컬 Chapter)
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import { documentToRow, rowToDocument } from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListDocuments(): Promise<Chapter[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.documents)
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToDocument);
}

export async function cloudListDocumentsByProject(
  projectId: string,
): Promise<Chapter[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.documents)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToDocument);
}

export async function cloudUpsertDocument(chapter: Chapter): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = documentToRow(chapter, userId);

  const { error } = await client.from(DB_TABLES.documents).upsert(row);
  if (error) throw error;
}

export async function cloudUpsertDocuments(chapters: Chapter[]): Promise<void> {
  if (chapters.length === 0) return;
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const rows = chapters.map((chapter) => documentToRow(chapter, userId));

  const { error } = await client.from(DB_TABLES.documents).upsert(rows);
  if (error) throw error;
}

export async function cloudGetDocumentById(
  documentId: string,
): Promise<Chapter | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.documents)
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToDocument(data) : null;
}

export async function cloudDeleteDocument(documentId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.documents)
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) throw error;
}
