"use client";

/**
 * =============================================================================
 * useTimelineEvents
 * -----------------------------------------------------------------------------
 * Timeline 사건 CRUD + 드래그 순서.
 * Section 목록은 Section Registry(SSOT) 를 구독한다 — 별도 조회 없음.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { syncTimelineEventsWithSectionRegistry } from "@/features/timeline/lib/timeline-section-sync";
import {
  timelineOptionsFromSectionRefs,
  type TimelineSectionOption,
} from "@/features/timeline/lib/timeline-section-options";
import {
  getSectionRegistrySnapshot,
  useSectionRegistry,
} from "@/features/sections";

export function useTimelineEvents(projectId: ProjectId) {
  const registry = useSectionRegistry(projectId);

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // Registry → 옵션 (Manuscript 와 동일한 SSOT, 추가 조회 없음)
  const sectionOptions: TimelineSectionOption[] = useMemo(
    () =>
      timelineOptionsFromSectionRefs(
        registry.sections,
        registry.primaryDocumentId,
      ),
    [registry.sections, registry.primaryDocumentId],
  );

  const primaryDocumentId: DocumentId | null = registry.primaryDocumentId;

  const normalizeWithRegistry = useCallback(
    async (list: TimelineEvent[]) => {
      const snap = getSectionRegistrySnapshot(projectId);
      if (!snap.ready) return list;
      const synced = await syncTimelineEventsWithSectionRegistry(list, snap);
      return synced.events;
    },
    [projectId],
  );

  // 사건 목록 로드 (프로젝트당 1회 경로) + Registry 준비 시 링크 정규화
  useEffect(() => {
    let cancelled = false;
    setIsReady(false);

    void (async () => {
      try {
        const list = await readTimelineEventsByProject(projectId);
        if (cancelled) return;
        const normalized = await normalizeWithRegistry(list);
        if (cancelled) return;
        setEvents(normalized);
        setError(null);
      } catch (err) {
        console.error("[useTimelineEvents] load failed", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Timeline을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, normalizeWithRegistry]);

  // Section 추가/삭제/이름변경/재정렬 → Registry generation 변경 시 링크만 재정규화
  useEffect(() => {
    if (!registry.ready || !isReady) return;

    let cancelled = false;
    void (async () => {
      const normalized = await normalizeWithRegistry(eventsRef.current);
      if (cancelled) return;
      setEvents(normalized);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    registry.ready,
    registry.generation,
    isReady,
    normalizeWithRegistry,
  ]);

  const refresh = useCallback(async () => {
    try {
      const list = await readTimelineEventsByProject(projectId);
      const normalized = await normalizeWithRegistry(list);
      setEvents(normalized);
      setError(null);
    } catch (err) {
      console.error("[useTimelineEvents] refresh failed", err);
      setError(
        err instanceof Error ? err.message : "Timeline을 불러오지 못했습니다.",
      );
    }
  }, [projectId, normalizeWithRegistry]);

  const create = useCallback(
    async (input: TimelineEventInput) => {
      const created = await createTimelineEvent(projectId, {
        ...input,
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
    sectionsReady: registry.ready,
    isReady,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}
