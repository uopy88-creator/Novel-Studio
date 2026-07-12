"use client";

/**
 * =============================================================================
 * useTimelineEvents
 * -----------------------------------------------------------------------------
 * Timeline 사건 CRUD + 드래그 순서 + Section 동기화.
 *
 * Manuscript Section 이 추가·삭제·재정렬되면 sync 로 옵션/링크를 맞춘다.
 * (구 Chapter Document 목록은 더 이상 읽지 않는다.)
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { DocumentId, ProjectId, TimelineEventId } from "@/types/ids";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  readTimelineEventsByProject,
  reorderTimelineEvents,
  updateTimelineEvent,
  type TimelineEventInput,
} from "@/features/timeline/lib/timeline-event-storage";
import {
  syncTimelineEventsWithSections,
} from "@/features/timeline/lib/timeline-section-sync";
import type { TimelineSectionOption } from "@/features/timeline/lib/timeline-section-options";

export function useTimelineEvents(projectId: ProjectId) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [sectionOptions, setSectionOptions] = useState<
    TimelineSectionOption[]
  >([]);
  const [primaryDocumentId, setPrimaryDocumentId] =
    useState<DocumentId | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await readTimelineEventsByProject(projectId);
      const synced = await syncTimelineEventsWithSections(projectId, list);
      setEvents(synced.events);
      setSectionOptions(synced.options);
      setPrimaryDocumentId(synced.primaryDocumentId);
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

  // Section 페이지에서 추가/삭제 후 돌아올 때 옵션 갱신
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const create = useCallback(
    async (input: TimelineEventInput) => {
      const created = await createTimelineEvent(projectId, {
        ...input,
        // 항상 primary Manuscript 에 연결
        documentId: input.documentId || primaryDocumentId || "",
      });
      await refresh();
      return created;
    },
    [projectId, primaryDocumentId, refresh],
  );

  const update = useCallback(
    async (id: TimelineEventId, input: Partial<TimelineEventInput>) => {
      const updated = await updateTimelineEvent(id, {
        ...input,
        documentId:
          input.documentId !== undefined
            ? input.documentId || primaryDocumentId || ""
            : undefined,
      });
      await refresh();
      return updated;
    },
    [primaryDocumentId, refresh],
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
    sectionOptions,
    primaryDocumentId,
    isReady,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}
