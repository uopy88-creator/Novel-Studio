/**
 * Self-test for Section parser + Chapter→Section flatten migration.
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/section-selftest.ts
 */

import assert from "node:assert/strict";
import {
  parseSections,
  serializeSections,
  splitTitleAndStableId,
} from "@/features/manuscript/lib/section-parser";
import {
  createSection,
  createSectionAtCursor,
  deleteSection,
  getSectionTriggerAtCursor,
  reorderSections,
} from "@/features/manuscript/lib/section-operations";
import {
  contentNeedsSectionMigration,
  flattenBodiesToSectionContent,
  stripChapterDelimiters,
} from "@/features/manuscript/lib/migrate-to-sections";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId } from "@/types/ids";

function makeChapter(
  id: string,
  title: string,
  sortOrder: number,
): Chapter {
  return {
    id: id as ChapterId,
    projectId: "proj-1",
    title,
    kind: "novel",
    sortOrder,
    status: "planned",
    wordCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

// --- parseSections: legacy scene_ tags still parse ---
{
  const content = `#1 Opening ·ns:scene_001
Once upon a time.

#2 Rising ·ns:section_002
Then something happened.`;
  const sections = parseSections(content);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].id, "scene_001");
  assert.equal(sections[0].title, "Opening");
  assert.equal(sections[1].id, "section_002");
  assert.equal(sections[1].title, "Rising");
  assert.equal(sections[0].number, 1);
  assert.equal(sections[1].number, 2);
}

// --- splitTitleAndStableId accepts both ---
{
  assert.deepEqual(splitTitleAndStableId("Hello ·ns:scene_003"), {
    title: "Hello",
    stableId: "scene_003",
  });
  assert.deepEqual(splitTitleAndStableId("World ·ns:section_004"), {
    title: "World",
    stableId: "section_004",
  });
}

// --- serialize round-trip preserves legacy id ---
{
  const sections = parseSections(`#1 A ·ns:scene_009\nBody`);
  const again = serializeSections(sections);
  assert.match(again, /·ns:scene_009/);
  const reparsed = parseSections(again);
  assert.equal(reparsed[0].id, "scene_009");
}

// --- chapter markers detection ---
{
  assert.equal(
    contentNeedsSectionMigration(
      "================\n⟦ns:chapter:abc⟧ Title\n================\nHi",
    ),
    true,
  );
  assert.equal(contentNeedsSectionMigration("#1 Alone\nText"), false);
}

// --- strip chapter delimiters ---
{
  const stripped = stripChapterDelimiters(
    "================\n⟦ns:chapter:x⟧ Ch1\n================\nHello",
  );
  assert.equal(stripped.includes("===="), false);
  assert.equal(stripped.includes("⟦ns:chapter:"), false);
  assert.match(stripped, /Hello/);
}

// --- flatten chapter bodies without markers → titled sections ---
{
  const chapters = [
    makeChapter("c1", "Intro", 0),
    makeChapter("c2", "Climax", 1),
  ];
  const bodies = new Map<ChapterId, string>([
    ["c1" as ChapterId, "First body"],
    ["c2" as ChapterId, "Second body"],
  ]);
  const content = flattenBodiesToSectionContent(chapters, bodies);
  assert.equal(contentNeedsSectionMigration(content), false);
  const sections = parseSections(content);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, "Intro");
  assert.equal(sections[1].title, "Climax");
  assert.match(sections[0].id, /^section_/);
  assert.equal(sections[0].body, "First body");
  assert.equal(sections[1].body, "Second body");
}

// --- flatten preserves existing # markers / scene ids ---
{
  const chapters = [makeChapter("c1", "Chapter One", 0)];
  const bodies = new Map<ChapterId, string>([
    [
      "c1" as ChapterId,
      `#1 Alpha ·ns:scene_010\nAAA\n\n#2 Beta ·ns:scene_011\nBBB`,
    ],
  ]);
  const content = flattenBodiesToSectionContent(chapters, bodies);
  const sections = parseSections(content);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].id, "scene_010");
  assert.equal(sections[1].id, "scene_011");
}

// --- createSection + createSectionAtCursor (# + Enter) ---
{
  // shared createSection
  const empty = parseSections("Hello world");
  const created = createSection(empty);
  assert.equal(created.sections.length, 2);
  assert.equal(created.sections[0].number, 1);
  assert.equal(created.sections[1].number, 2);
  assert.equal(created.sections[1].id, created.newSectionId);

  // trigger detection
  const draft = "Hello\n#";
  const trig = getSectionTriggerAtCursor(draft, draft.length);
  assert.ok(trig);
  assert.equal(trig?.title, "");

  // # + Enter creates numbered section and renumbers
  const atCursor = createSectionAtCursor(draft, draft.length);
  assert.ok(atCursor);
  const numbered = parseSections(atCursor!.content);
  assert.equal(numbered.length, 2);
  assert.equal(numbered[0].number, 1);
  assert.equal(numbered[1].number, 2);
  assert.match(atCursor!.content, /^#1 /m);
  assert.match(atCursor!.content, /^#2 /m);

  // insert between renumbers 1..N
  const three = createSection(created.sections, { afterIndex: 0 });
  assert.deepEqual(
    three.sections.map((s) => s.number),
    [1, 2, 3],
  );

  // reorder renumbers
  const reordered = reorderSections(
    three.sections,
    three.sections[2].id,
    three.sections[0].id,
  );
  assert.deepEqual(
    reordered.map((s) => s.number),
    [1, 2, 3],
  );
  assert.equal(reordered[0].id, three.sections[2].id);

  // delete renumbers without gaps
  const afterDelete = deleteSection(three.sections, three.sections[1].id);
  assert.deepEqual(
    afterDelete.map((s) => s.number),
    [1, 2],
  );

  // crooked markers get fixed on create path
  const crookedSrc =
    `#1 A ·ns:section_001\nbody\n\n#5 B ·ns:section_005\nmore\n#`;
  const crooked = createSectionAtCursor(crookedSrc, crookedSrc.length);
  assert.ok(crooked);
  const fixed = parseSections(crooked!.content);
  assert.deepEqual(
    fixed.map((s) => s.number),
    [1, 2, 3],
  );
}

console.log("section-selftest: all assertions passed");
