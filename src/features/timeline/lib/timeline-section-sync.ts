/**
 * =============================================================================
 * Timeline ↔ Section 동기화
 * -----------------------------------------------------------------------------
 * - 구 Chapter/Document 에 묶인 사건 링크를 primary Manuscript 로 옮긴다.
 * - 삭제된 Section 을 가리키는 링크는 제거한다 (사건은 유지, 연결만 해제).
 * - Section 선택 라벨은 현재 Manuscript 순서를 따른다.
 * =============================================================================
 */

import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { DocumentId, ProjectId } from "@/types/ids";
import { loadProjectManuscript } from "@/features/manuscript/lib/project-manuscript";
import { parseSections } from "@/features/manuscript/lib/section-parser";
import {
  loadTimelineSectionOptions,
  type TimelineSectionOption,
} from "@/features/timeline/lib/timeline-section-options";
import { updateTimelineEvent } from "@/features/timeline/lib/timeline-event-storage";

export interface TimelineSectionSyncResult {
  options: TimelineSectionOption[];
  /** 화면용으로 정규화된 사건 */
  events: TimelineEvent[];
  /** primary Manuscript Document ID */
  primaryDocumentId: DocumentId;
}

/**
 * 사건 목록을 현재 Section 집합에 맞춰 정규화한다.
 * - documentId → 항상 primary
 * - sectionStableId 가 현재 Manuscript 에 없으면 링크 제거
 */
export function normalizeTimelineEventsToSections(
  events: TimelineEvent[],
  options: TimelineSectionOption[],
  primaryDocumentId: DocumentId,
): TimelineEvent[] {
  const validIds = new Set(options.map((o) => o.sectionStableId));

  return events.map((event) => {
    const sectionId = event.sectionStableId;
    if (!sectionId) {
      if (event.documentId && event.documentId !== primaryDocumentId) {
        return { ...event, documentId: primaryDocumentId };
      }
      return event;
    }

    if (!validIds.has(sectionId)) {
      // 삭제된 Section / 구 Chapter 잔여 — 연결만 해제
      return {
        ...event,
        documentId: undefined,
        sectionStableId: undefined,
      };
    }

    if (event.documentId !== primaryDocumentId) {
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
 * Section 옵션 로드 + 사건 링크 정규화(+저장).
 * 새 Section / 삭제 / 순서 변경이 Manuscript 에 반영된 뒤 Timeline 이 이를 따른다.
 */
export async function syncTimelineEventsWithSections(
  projectId: ProjectId,
  events: TimelineEvent[],
): Promise<TimelineSectionSyncResult> {
  const [{ primaryDocumentId }, options] = await Promise.all([
    loadProjectManuscript(projectId),
    loadTimelineSectionOptions(projectId),
  ]);

  // options 의 documentId 가 primary 와 일치하는지 한 번 더 맞춤
  const alignedOptions = options.map((opt) => ({
    ...opt,
    documentId: primaryDocumentId,
  }));

  const normalized = normalizeTimelineEventsToSections(
    events,
    alignedOptions,
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
    options: alignedOptions,
    events: normalized,
    primaryDocumentId,
  };
}

/**
 * 현재 Manuscript Section 안정 ID 집합 (테스트·검증용).
 */
export async function listCurrentSectionStableIds(
  projectId: ProjectId,
): Promise<Set<string>> {
  const { content } = await loadProjectManuscript(projectId);
  return new Set(parseSections(content ?? "").map((s) => s.id));
}
