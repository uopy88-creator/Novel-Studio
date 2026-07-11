/**
 * timeline_events 테이블 리포지토리 — Supabase CRUD 전용
 */

import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import { requireCloudUserId } from "@/database/supabase/cloud-mode";
import {
  rowToTimelineEvent,
  timelineEventToRow,
} from "@/database/supabase/mappers";
import { DB_TABLES } from "@/database/supabase/types";
import { requireSupabaseClient } from "@/lib/supabase/client";

export async function cloudListTimelineEvents(): Promise<TimelineEvent[]> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { data, error } = await client
    .from(DB_TABLES.timeline_events)
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
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

  if (error) throw error;
  return (data ?? []).map(rowToTimelineEvent);
}

export async function cloudUpsertTimelineEvent(
  event: TimelineEvent,
): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const { error } = await client
    .from(DB_TABLES.timeline_events)
    .upsert(timelineEventToRow(event, userId));
  if (error) throw error;
}

export async function cloudUpsertTimelineEvents(
  events: TimelineEvent[],
): Promise<void> {
  if (events.length === 0) return;
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();
  const { error } = await client
    .from(DB_TABLES.timeline_events)
    .upsert(events.map((e) => timelineEventToRow(e, userId)));
  if (error) throw error;
}

export async function cloudDeleteTimelineEvent(eventId: string): Promise<void> {
  const client = requireSupabaseClient();
  const userId = await requireCloudUserId();

  const { error } = await client
    .from(DB_TABLES.timeline_events)
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
}
