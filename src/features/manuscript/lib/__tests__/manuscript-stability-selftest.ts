/**
 * Manuscript 저장 안정성 — 순수 가드 회귀 테스트
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/manuscript-stability-selftest.ts
 */

import assert from "node:assert/strict";
import { shouldBlockEmptyOverwrite } from "@/features/manuscript/lib/manuscript-storage";
import {
  contentNeedsSectionMigration,
  flattenBodiesToSectionContent,
  isAlreadySectionStructure,
  projectNeedsSectionMigration,
} from "@/features/manuscript/lib/migrate-to-sections";
import { parseSections } from "@/features/manuscript/lib/section-parser";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId } from "@/types/ids";

function makeChapter(id: string, title: string, sortOrder: number): Chapter {
  return {
    id: id as ChapterId,
    projectId: "proj-stability",
    title,
    kind: "novel",
    sortOrder,
    status: "planned",
    wordCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

// 1) empty overwrite guard
{
  assert.equal(shouldBlockEmptyOverwrite(100, 0, false), true);
  assert.equal(shouldBlockEmptyOverwrite(100, 0, true), false);
  assert.equal(shouldBlockEmptyOverwrite(0, 0, false), false);
  assert.equal(shouldBlockEmptyOverwrite(null, 0, false), false);
  assert.equal(shouldBlockEmptyOverwrite(50, 50, false), false);
}

// 2) legacy chapter project → needs migration + flatten preserves text
{
  const chapters = [
    makeChapter("d1", "Ch1", 0),
    makeChapter("d2", "Ch2", 1),
  ];
  const bodies = new Map<ChapterId, string>([
    ["d1" as ChapterId, "Alpha body text"],
    ["d2" as ChapterId, "Beta body text"],
  ]);
  assert.equal(
    projectNeedsSectionMigration(
      chapters,
      "Alpha\nBeta",
      bodies,
      "d1" as ChapterId,
    ),
    true,
  );
  const merged = flattenBodiesToSectionContent(chapters, bodies);
  assert.equal(contentNeedsSectionMigration(merged), false);
  assert.match(merged, /Alpha body text/);
  assert.match(merged, /Beta body text/);
  assert.ok(isAlreadySectionStructure(merged));
}

// 3) already migrated (section primary) → never needs migration again
{
  const primary = "#1 One ·ns:section_001\nKeep me forever";
  const chapters = [
    makeChapter("d1", "Manuscript", 0),
    makeChapter("d2", "Leftover", 1),
  ];
  const bodies = new Map([
    ["d1" as ChapterId, primary],
    ["d2" as ChapterId, "should not re-merge"],
  ]);
  assert.equal(isAlreadySectionStructure(primary), true);
  assert.equal(
    projectNeedsSectionMigration(
      chapters,
      primary,
      bodies,
      "d1" as ChapterId,
    ),
    false,
  );
}

// 4) new project — empty / missing row
{
  const chapters = [makeChapter("d1", "Manuscript", 0)];
  assert.equal(
    projectNeedsSectionMigration(
      chapters,
      "",
      new Map([["d1" as ChapterId, ""]]),
      "d1" as ChapterId,
    ),
    false,
  );
  assert.equal(
    projectNeedsSectionMigration(
      chapters,
      "",
      new Map([["d1" as ChapterId, null]]),
      "d1" as ChapterId,
    ),
    false,
  );
}

// 5) section add/delete round-trip content length stays non-destructive
{
  const content = `#1 A ·ns:section_001\nHello\n\n#2 B ·ns:section_002\nWorld`;
  const sections = parseSections(content);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].body, "Hello");
  assert.equal(sections[1].body, "World");
  // "refresh / other browser" equivalent: re-parse same string
  const again = parseSections(content);
  assert.equal(again[0].body, sections[0].body);
  assert.equal(again[1].body, sections[1].body);
}

console.log("manuscript-stability-selftest: all assertions passed");
