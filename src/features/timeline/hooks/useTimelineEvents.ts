"use client";

/**
 * =============================================================================
 * useTimelineEvents
 * -----------------------------------------------------------------------------
 * Timeline 사건 CRUD + 드래그 순서 변경.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { ProjectId, TimelineEventId } from "@/types/ids";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  readTimelineEventsByProject,
  reorderTimelineEvents,
  updateTimelineEvent,
  type TimelineEventInput,
} from "@/features/timeline/lib/timeline-event-storage";

export function useTimelineEvents(projectId: ProjectId) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await readTimelineEventsByProject(projectId);
      setEvents(list);
      setError(null);
    } catch (err) {
      console.error("[useTimelineEvents] load failed", err);
      setError(
        err instanceof Error ? err.message : "Timeline을 불러오지 못했습니다.",
      );
    } finally {
      setIsReady(true);
    }
  }, [projectId]);

  useEffect(() => {
    setIsReady(false);
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: TimelineEventInput) => {
      const created = await createTimelineEvent(projectId, input);
      await refresh();
      return created;
    },
    [projectId, refresh],
  );

  const update = useCallback(
    async (id: TimelineEventId, input: Partial<TimelineEventInput>) => {
      const updated = await updateTimelineEvent(id, input);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: TimelineEventId) => {
      await deleteTimelineEvent(id);
      await refresh();
    },
    [refresh],
  );

  const reorder = useCallback(
    async (activeId: string, overId: string) => {
      const from = events.findIndex((e) => e.id === activeId);
      const to = events.findIndex((e) => e.id === overId);
      if (from < 0 || to < 0 || from === to) return;

      const next = [...events];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      // 낙관적 UI
      setEvents(next.map((e, i) => ({ ...e, sortOrder: i })));

      try {
        const saved = await reorderTimelineEvents(
          projectId,
          next.map((e) => e.id),
        );
        setEvents(saved);
      } catch (err) {
        console.error("[useTimelineEvents] reorder failed", err);
        await refresh();
      }
    },
    [events, projectId, refresh],
  );

  return {
    events,
    isReady,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}
