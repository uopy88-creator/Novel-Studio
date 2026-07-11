/**
 * =============================================================================
 * Timeline Event Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 사건 목록 CRUD + 드래그 순서(sortOrder) 저장.
 * =============================================================================
 */

import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type {
  CharacterId,
  ChapterId,
  ProjectId,
  TimelineEventId,
} from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteTimelineEvent,
  cloudListTimelineEvents,
  cloudListTimelineEventsByProject,
  cloudUpsertTimelineEvent,
  cloudUpsertTimelineEvents,
} from "@/database/supabase/timeline-events-repo";
import { TIMELINE_EVENTS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { TIMELINE_EVENTS_STORAGE_KEY };

export interface TimelineEventInput {
  title: string;
  description?: string;
  documentId?: ChapterId | "";
  sceneStableId?: string | "";
  characterId?: CharacterId | "";
}

function readLocal(): TimelineEvent[] {
  return readJsonArray<TimelineEvent>(TIMELINE_EVENTS_STORAGE_KEY);
}

function writeLocal(events: TimelineEvent[]): void {
  writeJsonArray(TIMELINE_EVENTS_STORAGE_KEY, events);
}

function backup(events: TimelineEvent[]): void {
  writeWorkDataBackup(TIMELINE_EVENTS_STORAGE_KEY, events);
}

export function createTimelineEventId(): TimelineEventId {
  return crypto.randomUUID();
}

function sortByOrder(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeOptionalId<T extends string>(
  value: T | "" | undefined,
): T | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

export async function readAllTimelineEvents(): Promise<TimelineEvent[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListTimelineEvents();
    backup(list);
    return list;
  }
  return sortByOrder(readLocal());
}

export async function readTimelineEventsByProject(
  projectId: ProjectId,
): Promise<TimelineEvent[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListTimelineEventsByProject(projectId);
    try {
      backup(await cloudListTimelineEvents());
    } catch {
      // 백업 실패 무시
    }
    return list;
  }
  return sortByOrder(
    readLocal().filter((e) => e.projectId === projectId),
  );
}

export async function createTimelineEvent(
  projectId: ProjectId,
  input: TimelineEventInput,
): Promise<TimelineEvent> {
  const existing = await readTimelineEventsByProject(projectId);
  const maxOrder = existing.reduce(
    (max, e) => Math.max(max, e.sortOrder),
    -1,
  );
  const timestamp = nowIso();
  const event: TimelineEvent = {
    id: createTimelineEventId(),
    projectId,
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    sortOrder: maxOrder + 1,
    documentId: normalizeOptionalId(input.documentId),
    sceneStableId: normalizeOptionalId(input.sceneStableId),
    characterId: normalizeOptionalId(input.characterId),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertTimelineEvent(event);
    try {
      backup(await cloudListTimelineEvents());
    } catch {
      // 백업 실패 무시
    }
    return event;
  }

  writeLocal([event, ...readLocal()]);
  return event;
}

export async function updateTimelineEvent(
  id: TimelineEventId,
  patch: Partial<TimelineEventInput>,
): Promise<TimelineEvent | null> {
  const applyPatch = (current: TimelineEvent): TimelineEvent => ({
    ...current,
    title:
      patch.title !== undefined ? patch.title.trim() : current.title,
    description:
      patch.description !== undefined
        ? patch.description.trim()
        : current.description,
    documentId:
      patch.documentId !== undefined
        ? normalizeOptionalId(patch.documentId)
        : current.documentId,
    sceneStableId:
      patch.sceneStableId !== undefined
        ? normalizeOptionalId(patch.sceneStableId)
        : current.sceneStableId,
    characterId:
      patch.characterId !== undefined
        ? normalizeOptionalId(patch.characterId)
        : current.characterId,
    updatedAt: nowIso(),
  });

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListTimelineEvents();
    const index = all.findIndex((e) => e.id === id);
    if (index < 0) return null;
    const updated = applyPatch(all[index]);
    await cloudUpsertTimelineEvent(updated);
    try {
      backup(await cloudListTimelineEvents());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocal();
  const index = all.findIndex((e) => e.id === id);
  if (index < 0) return null;
  const updated = applyPatch(all[index]);
  const next = [...all];
  next[index] = updated;
  writeLocal(next);
  return updated;
}

export async function deleteTimelineEvent(
  id: TimelineEventId,
): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudDeleteTimelineEvent(id);
    try {
      backup(await cloudListTimelineEvents());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const next = readLocal().filter((e) => e.id !== id);
  writeLocal(next);
  return true;
}

/**
 * 드래그로 순서를 바꾼 뒤 sortOrder 를 0..n-1 로 다시 매긴다.
 */
export async function reorderTimelineEvents(
  projectId: ProjectId,
  orderedIds: TimelineEventId[],
): Promise<TimelineEvent[]> {
  const current = await readTimelineEventsByProject(projectId);
  const byId = new Map(current.map((e) => [e.id, e]));
  const timestamp = nowIso();

  const reordered: TimelineEvent[] = [];
  orderedIds.forEach((id, index) => {
    const event = byId.get(id);
    if (!event) return;
    reordered.push({
      ...event,
      sortOrder: index,
      updatedAt: timestamp,
    });
    byId.delete(id);
  });
  // 누락된 항목은 뒤에 유지
  for (const leftover of byId.values()) {
    reordered.push({
      ...leftover,
      sortOrder: reordered.length,
      updatedAt: timestamp,
    });
  }

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertTimelineEvents(reordered);
    try {
      backup(await cloudListTimelineEvents());
    } catch {
      // 백업 실패 무시
    }
    return reordered;
  }

  const others = readLocal().filter((e) => e.projectId !== projectId);
  writeLocal([...others, ...reordered]);
  return reordered;
}
