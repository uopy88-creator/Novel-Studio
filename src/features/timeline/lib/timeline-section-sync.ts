/**
 * =============================================================================
 * Timeline ↔ Section 동기화
 * -----------------------------------------------------------------------------
 * - 삭제된 Section 을 가리키는 링크는 제거한다 (사건은 유지, 연결만 해제).
 * - Section 목록은 Registry 스냅샷을 사용한다 (재조회 없음).
 * =============================================================================
 */

import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { DocumentId } from "@/types/ids";
import {
  timelineOptionsFromSectionRefs,
  type TimelineSectionOption,
} from "@/features/timeline/lib/timeline-section-options";
import { updateTimelineEvent } from "@/features/timeline/lib/timeline-event-storage";
import type { SectionRegistrySnapshot } from "@/features/sections/section-registry";

export interface TimelineSectionSyncResult {
  options: TimelineSectionOption[];
  /** 화면용으로 정규화된 사건 */
  events: TimelineEvent[];
  /** primary Manuscript Document ID (딥링크용) */
  primaryDocumentId: DocumentId | null;
}

/**
 * 사건 목록을 현재 Section 집합에 맞춰 정규화한다.
 * - sectionStableId 가 현재 Registry 에 없으면 링크 제거 (오류 없음)
 * - documentId → 가능하면 primary 로 맞춤
 */
export function normalizeTimelineEventsToSections(
  events: TimelineEvent[],
  options: TimelineSectionOption[],
  primaryDocumentId: DocumentId | null,
): TimelineEvent[] {
  const validIds = new Set(options.map((o) => o.sectionStableId));

  return events.map((event) => {
    const sectionId = event.sectionStableId;
    if (!sectionId) {
      if (
        primaryDocumentId &&
        event.documentId &&
        event.documentId !== primaryDocumentId
      ) {
        return { ...event, documentId: primaryDocumentId };
      }
      return event;
    }

    if (!validIds.has(sectionId)) {
      // 삭제된 Section — 연결만 해제 (사건 자체는 유지)
      return {
        ...event,
        documentId: undefined,
        sectionStableId: undefined,
      };
    }

    if (primaryDocumentId && event.documentId !== primaryDocumentId) {
      return { ...event, documentId: primaryDocumentId };
    }
    return event;
  });
}

/** 변경된 Section 링크만 저장소에 반영 */
export async function persistTimelineSectionSync(
  before: TimelineEvent[],
  after: TimelineEvent[],
): Promise<void> {
  const beforeById = new Map(before.map((e) => [e.id, e]));

  for (const next of after) {
    const prev = beforeById.get(next.id);
    if (!prev) continue;

    const linkChanged =
      prev.documentId !== next.documentId ||
      prev.sectionStableId !== next.sectionStableId;

    if (!linkChanged) continue;

    await updateTimelineEvent(next.id, {
      documentId: next.documentId ?? "",
      sectionStableId: next.sectionStableId ?? "",
      title: next.title,
      description: next.description,
      characterId: next.characterId ?? "",
    });
  }
}

/**
 * Registry 스냅샷으로 옵션을 만들고 사건 링크를 정규화한다.
 * Manuscript 를 다시 조회하지 않는다.
 */
export async function syncTimelineEventsWithSectionRegistry(
  events: TimelineEvent[],
  registry: SectionRegistrySnapshot,
): Promise<TimelineSectionSyncResult> {
  const primaryDocumentId = registry.primaryDocumentId;
  const options = timelineOptionsFromSectionRefs(
    registry.sections,
    primaryDocumentId,
  );

  const normalized = normalizeTimelineEventsToSections(
    events,
    options,
    primaryDocumentId,
  );

  try {
    await persistTimelineSectionSync(events, normalized);
  } catch (error) {
    console.error(
      "[timeline-section-sync] failed to persist normalized links",
      error,
    );
  }

  return {
    options,
    events: normalized,
    primaryDocumentId,
  };
}

/**
 * @deprecated syncTimelineEventsWithSectionRegistry 사용
 */
export async function syncTimelineEventsWithSections(
  events: TimelineEvent[],
  registry: SectionRegistrySnapshot,
): Promise<TimelineSectionSyncResult> {
  return syncTimelineEventsWithSectionRegistry(events, registry);
}
