/**
 * Self-test: Timeline Section options + Registry normalize
 * Run: npx --yes tsx src/features/timeline/lib/__tests__/timeline-section-selftest.ts
 */

import assert from "node:assert/strict";
import {
  decodeSectionOptionValue,
  encodeSectionOptionValue,
  timelineOptionsFromSectionRefs,
} from "@/features/timeline/lib/timeline-section-options";
import { normalizeTimelineEventsToSections } from "@/features/timeline/lib/timeline-section-sync";
import {
  formatSectionRefLabel,
  publishSections,
  resetSectionRegistry,
  getSectionRegistrySnapshot,
} from "@/features/sections/section-registry";
import {
  isEmptyManuscriptContent,
  sectionRefsFromContent,
} from "@/features/sections/section-list-from-content";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { DocumentId, ProjectId, TimelineEventId } from "@/types/ids";
import type { TimelineSectionOption } from "@/features/timeline/lib/timeline-section-options";

const primary = "doc-primary" as DocumentId;
const projectId = "proj-timeline" as ProjectId;

const refs = [
  { id: "section_001", number: 1, title: "프롤로그" },
  { id: "section_002", number: 2, title: "첫 만남" },
  { id: "section_003", number: 3, title: "갈등" },
];

const options: TimelineSectionOption[] = timelineOptionsFromSectionRefs(
  refs,
  primary,
);

function makeEvent(
  partial: Partial<TimelineEvent> & Pick<TimelineEvent, "id">,
): TimelineEvent {
  return {
    projectId,
    title: "E",
    description: "",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
    id: partial.id as TimelineEventId,
  };
}

// label format #N Title
assert.equal(formatSectionRefLabel(refs[0]), "#1 프롤로그");
assert.equal(options[0].label, "#1 프롤로그");
assert.equal(options[1].label, "#2 첫 만남");
assert.equal(options[2].sectionStableId, "section_003");

// encode/decode — ID only
assert.equal(encodeSectionOptionValue(primary, "section_001"), "section_001");
assert.deepEqual(decodeSectionOptionValue("section_001"), {
  sectionStableId: "section_001",
});
assert.deepEqual(decodeSectionOptionValue("old-doc::section_001"), {
  documentId: "old-doc",
  sectionStableId: "section_001",
});

// remap old chapter documentId → primary (ID link kept)
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

// deleted section → unlink without error
{
  const events = [
    makeEvent({
      id: "e2",
      documentId: primary,
      sectionStableId: "section_gone",
    }),
  ];
  const next = normalizeTimelineEventsToSections(events, options, primary);
  assert.equal(next[0].sectionStableId, undefined);
  assert.equal(next[0].documentId, undefined);
}

// reorder numbers: same ID still matches after number change
{
  const reorderedOptions = timelineOptionsFromSectionRefs(
    [
      { id: "section_002", number: 1, title: "첫 만남" },
      { id: "section_001", number: 2, title: "프롤로그" },
    ],
    primary,
  );
  const events = [
    makeEvent({
      id: "e3",
      documentId: primary,
      sectionStableId: "section_001",
    }),
  ];
  const next = normalizeTimelineEventsToSections(
    events,
    reorderedOptions,
    primary,
  );
  assert.equal(next[0].sectionStableId, "section_001");
  assert.equal(reorderedOptions[1].label, "#2 프롤로그");
}

// empty manuscript → no selectable sections
assert.equal(isEmptyManuscriptContent(""), true);
assert.equal(isEmptyManuscriptContent("   \n"), true);
assert.deepEqual(sectionRefsFromContent(""), []);
assert.ok(sectionRefsFromContent("#1 A ·ns:section_001\nHi").length >= 1);

// Registry publish / live guard
resetSectionRegistry(projectId);
publishSections(projectId, {
  sections: refs,
  primaryDocumentId: primary,
  source: "live",
});
assert.equal(getSectionRegistrySnapshot(projectId).sections.length, 3);
publishSections(projectId, {
  sections: [],
  primaryDocumentId: primary,
  source: "persisted",
});
// live 보호 — persisted 가 비우지 못함
assert.equal(getSectionRegistrySnapshot(projectId).sections.length, 3);
publishSections(projectId, {
  sections: refs.slice(0, 1),
  primaryDocumentId: primary,
  source: "persisted",
  force: true,
});
assert.equal(getSectionRegistrySnapshot(projectId).sections.length, 1);
resetSectionRegistry(projectId);

console.log("timeline-section-selftest: all assertions passed (PASS)");
