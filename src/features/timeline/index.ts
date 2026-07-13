/**
 * =============================================================================
 * Timeline (사건 시간순 정리) — Section 기준
 * =============================================================================
 */

export { TimelinePage } from "./components/TimelinePage";
export type { TimelinePageProps } from "./components/TimelinePage";
export type { TimelineEvent } from "./types/timeline-event";
export {
  timelineOptionsFromSectionRefs,
  type TimelineSectionOption,
} from "./lib/timeline-section-options";
export {
  syncTimelineEventsWithSectionRegistry,
  syncTimelineEventsWithSections,
  normalizeTimelineEventsToSections,
} from "./lib/timeline-section-sync";
