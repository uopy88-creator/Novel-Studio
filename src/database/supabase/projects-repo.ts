/**
 * =============================================================================
 * projects 테이블 리포지토리
 * =============================================================================
 */

import type { Project } from "@/features/projects/types/project";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  projectToRow,
  projectTypeForRow,
  rowToProject,
} from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbProjectRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "");
  const record = error as { message?: unknown; code?: unknown };
  const message =
    typeof record.message === "string" ? record.message : String(error);
  const code = typeof record.code === "string" ? record.code : "";
  return `${message} ${code}`;
}

function isMissingProjectsColumnError(
  error: unknown,
  column: "type" | "deleted_at",
): boolean {
  const blob = errorMessage(error);
  return (
    new RegExp(`['"]${column}['"]`).test(blob) ||
    (blob.includes("schema cache") && blob.includes(column)) ||
    blob.includes(`column ${column}`) ||
    blob.includes(`.${column}`)
  );
}

/** 활성 작품만 (deleted_at IS NULL) — 컬럼 없으면 전체 목록 */
export async function cloudListProjects(): Promise<Project[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const withSoftHide = await client
    .from(DB_TABLES.projects)
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (!withSoftHide.error) {
    return (withSoftHide.data ?? []).map(rowToProject);
  }

  // deleted_at 미적용 DB — soft-hide 필터 없이 재시도
  if (isMissingProjectsColumnError(withSoftHide.error, "deleted_at")) {
    const retry = await client
      .from(DB_TABLES.projects)
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });
    if (retry.error) throw toCloudError(retry.error);
    return (retry.data ?? []).map(rowToProject);
  }

  throw toCloudError(withSoftHide.error);
}

/** id 로 조회 — soft-hide 포함 (휴지통 capture 등) */
export async function cloudGetProjectById(
  projectId: string,
): Promise<Project | null> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.projects)
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw toCloudError(error);
  return data ? rowToProject(data) : null;
}

export async function cloudUpsertProject(project: Project): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const base = projectToRow(project, userId);

  // 최신 스키마: type 포함. deleted_at 은 일반 upsert 에서 건드리지 않는다
  // (soft-hide 된 작품을 실수로 복원하지 않기 위함)
  const full: DbProjectRow = {
    ...base,
    type: projectTypeForRow(project),
  };

  const first = await client.from(DB_TABLES.projects).upsert(full);
  if (!first.error) return;

  // type 미적용 — type 없이 재시도
  if (isMissingProjectsColumnError(first.error, "type")) {
    const withoutType: DbProjectRow = { ...base };
    const second = await client.from(DB_TABLES.projects).upsert(withoutType);
    if (!second.error) return;
    throw toCloudError(second.error, "작품 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "작품 저장에 실패했습니다.");
}

/** Soft-hide — 자식 CASCADE 없이 deleted_at 만 설정 */
export async function cloudHideProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingProjectsColumnError(error, "deleted_at")) {
      throw new Error(
        "휴지통(soft-hide) 컬럼이 없습니다. Supabase SQL Editor에서 " +
          "supabase/migrations/20260714000005_trash_items.sql 을 실행해 주세요.",
      );
    }
    throw toCloudError(error);
  }
}

/** Soft-hide 해제 */
export async function cloudUnhideProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .update({ deleted_at: null })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingProjectsColumnError(error, "deleted_at")) {
      throw new Error(
        "휴지통(soft-hide) 컬럼이 없습니다. Supabase SQL Editor에서 " +
          "supabase/migrations/20260714000005_trash_items.sql 을 실행해 주세요.",
      );
    }
    throw toCloudError(error);
  }
}

export async function cloudDeleteProject(projectId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.projects)
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error);
}
