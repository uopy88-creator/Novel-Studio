/**
 * Self-test: Timeline Section options + event normalize
 * Run: npx --yes tsx src/features/timeline/lib/__tests__/timeline-section-selftest.ts
 */

import assert from "node:assert/strict";
import {
  decodeSectionOptionValue,
  encodeSectionOptionValue,
} from "@/features/timeline/lib/timeline-section-options";
import { normalizeTimelineEventsToSections } from "@/features/timeline/lib/timeline-section-sync";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { DocumentId, ProjectId, TimelineEventId } from "@/types/ids";
import type { TimelineSectionOption } from "@/features/timeline/lib/timeline-section-options";

const primary = "doc-primary" as DocumentId;

const options: TimelineSectionOption[] = [
  {
    value: "section_001",
    documentId: primary,
    sectionStableId: "section_001",
    sectionNumber: 1,
    sectionTitle: "Opening",
    label: "1. Opening",
  },
  {
    value: "section_002",
    documentId: primary,
    sectionStableId: "section_002",
    sectionNumber: 2,
    sectionTitle: "Climax",
    label: "2. Climax",
  },
];

function makeEvent(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, "id">,
): TimelineEvent {
  return {
    projectId: "proj" as ProjectId,
    title: "E",
    description: "",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
    id: partial.id as TimelineEventId,
  };
}

// encode/decode
assert.equal(encodeSectionOptionValue(primary, "section_001"), "section_001");
assert.deepEqual(decodeSectionOptionValue("section_001"), {
  sectionStableId: "section_001",
});
assert.deepEqual(decodeSectionOptionValue("old-doc::section_001"), {
  documentId: "old-doc",
  sectionStableId: "section_001",
});

// remap old chapter documentId → primary
{
  const events = [
    makeEvent({
      id: "e1",
      documentId: "old-chapter" as DocumentId,
      sectionStableId: "section_001",
    }),
  ];
  const next = normalizeTimelineEventsToSections(events, options, primary);
  assert.equal(next[0].documentId, primary);
  assert.equal(next[0].sectionStableId, "section_001");
}

// drop deleted section link (and old chapter-only leftovers)
{
  const events = [
    makeEvent({
      id: "e2",
      documentId: "old-chapter" as DocumentId,
      sectionStableId: "section_gone",
    }),
  ];
  const next = normalizeTimelineEventsToSections(events, options, primary);
  assert.equal(next[0].sectionStableId, undefined);
  assert.equal(next[0].documentId, undefined);
}

// section order in options preserved
assert.deepEqual(
  options.map((o) => o.sectionNumber),
  [1, 2],
);

console.log("timeline-section-selftest: all assertions passed (PASS)");
