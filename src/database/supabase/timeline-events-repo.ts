/**
 * timeline_events 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  rowToTimelineEvent,
  timelineEventToRow,
} from "@/database/supabase/mappers";
import { toCloudError } from "@/database/supabase/to-cloud-error";
import { DB_TABLES } from "@/database/supabase/types";
import type { DbTimelineEventRow } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

function isForeignKeyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const message =
    typeof record.message === "string" ? record.message : String(error);
  return (
    code === "23503" ||
    message.includes("foreign key") ||
    message.includes("document_id")
  );
}

/** document_id / character_id 없이 저장 (FK 깨진 링크 방어) */
function timelineEventToLooseRow(
  event: TimelineEvent,
  userId: string,
): DbTimelineEventRow {
  const row = timelineEventToRow(event, userId);
  return {
    ...row,
    document_id: null,
    character_id: null,
  };
}

export async function cloudListTimelineEvents(): Promise<TimelineEvent[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.timeline_events)
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToTimelineEvent);
}

export async function cloudListTimelineEventsByProject(
  projectId: string,
): Promise<TimelineEvent[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.timeline_events)
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw toCloudError(error);
  return (data ?? []).map(rowToTimelineEvent);
}

export async function cloudUpsertTimelineEvent(
  event: TimelineEvent,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const row = timelineEventToRow(event, userId);

  const first = await client.from(DB_TABLES.timeline_events).upsert(row);
  if (!first.error) return;

  // stale document_id / character_id FK — 링크만 비우고 사건은 저장
  if (isForeignKeyError(first.error)) {
    const retry = await client
      .from(DB_TABLES.timeline_events)
      .upsert(timelineEventToLooseRow(event, userId));
    if (!retry.error) return;
    throw toCloudError(retry.error, "Timeline 사건 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "Timeline 사건 저장에 실패했습니다.");
}

export async function cloudUpsertTimelineEvents(
  events: TimelineEvent[],
): Promise<void> {
  if (events.length === 0) return;
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const rows = events.map((e) => timelineEventToRow(e, userId));

  const first = await client.from(DB_TABLES.timeline_events).upsert(rows);
  if (!first.error) return;

  if (isForeignKeyError(first.error)) {
    const retry = await client
      .from(DB_TABLES.timeline_events)
      .upsert(events.map((e) => timelineEventToLooseRow(e, userId)));
    if (!retry.error) return;
    throw toCloudError(retry.error, "Timeline 순서 저장에 실패했습니다.");
  }

  throw toCloudError(first.error, "Timeline 순서 저장에 실패했습니다.");
}

export async function cloudDeleteTimelineEvent(eventId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.timeline_events)
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw toCloudError(error, "Timeline 사건 삭제에 실패했습니다.");
}
