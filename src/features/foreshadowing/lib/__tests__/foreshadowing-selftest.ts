/**
 * Self-test for Foreshadowing service helpers (filter / sort / query / normalize).
 * Run: npx --yes tsx src/features/foreshadowing/lib/__tests__/foreshadowing-selftest.ts
 */

import assert from "node:assert/strict";
import {
  filterForeshadowingsByQuery,
  filterForeshadowingsByStatus,
  sortForeshadowings,
  queryForeshadowings,
} from "@/features/foreshadowing/lib/foreshadowing-service";
import {
  FORESHADOWING_STATUS_LABELS,
  normalizeForeshadowingStatus,
  type Foreshadowing,
} from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";

function makeItem(
  partial: Pick<Foreshadowing, "id" | "title" | "status"> &
    Partial<Foreshadowing>,
): Foreshadowing {
  return {
    projectId: "proj-1" as ProjectId,
    description: "",
    relatedCharacterIds: [],
    importance: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
    id: partial.id as ForeshadowingId,
  };
}

const items: Foreshadowing[] = [
  makeItem({
    id: "fs-1",
    title: "Broken Mirror",
    description: "Hints at the twin identity",
    status: "planted",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  }),
  makeItem({
    id: "fs-2",
    title: "Red Scarf",
    description: "Appears in the market scene",
    status: "pending_payoff",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  }),
  makeItem({
    id: "fs-3",
    title: "Alpha Signal",
    description: "Already paid off in act 2",
    status: "paid_off",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  }),
];

let failed = false;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed = true;
    console.error(`FAIL: ${name}`);
    console.error(err);
  }
}

check("normalize maps planned/dropped → planted", () => {
  assert.equal(normalizeForeshadowingStatus("planned"), "planted");
  assert.equal(normalizeForeshadowingStatus("dropped"), "planted");
  assert.equal(normalizeForeshadowingStatus("planted"), "planted");
  assert.equal(normalizeForeshadowingStatus("pending_payoff"), "pending_payoff");
  assert.equal(normalizeForeshadowingStatus("paid_off"), "paid_off");
  assert.equal(normalizeForeshadowingStatus("unknown"), "planted");
});

check("search finds title and description", () => {
  const byTitle = filterForeshadowingsByQuery(items, "mirror");
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, "fs-1");

  const byDesc = filterForeshadowingsByQuery(items, "market");
  assert.equal(byDesc.length, 1);
  assert.equal(byDesc[0].id, "fs-2");

  const empty = filterForeshadowingsByQuery(items, "  ");
  assert.equal(empty.length, 3);
});

check("status filter works", () => {
  assert.equal(filterForeshadowingsByStatus(items, "all").length, 3);
  const planted = filterForeshadowingsByStatus(items, "planted");
  assert.equal(planted.length, 1);
  assert.equal(planted[0].id, "fs-1");
  const pending = filterForeshadowingsByStatus(items, "pending_payoff");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, "fs-2");
  const paid = filterForeshadowingsByStatus(items, "paid_off");
  assert.equal(paid.length, 1);
  assert.equal(paid[0].id, "fs-3");
});

check("sort newest/oldest/title works", () => {
  const newest = sortForeshadowings(items, "newest");
  assert.deepEqual(
    newest.map((i) => i.id),
    ["fs-1", "fs-2", "fs-3"],
  );

  const oldest = sortForeshadowings(items, "oldest");
  assert.deepEqual(
    oldest.map((i) => i.id),
    ["fs-3", "fs-2", "fs-1"],
  );

  const byTitle = sortForeshadowings(items, "title");
  assert.deepEqual(
    byTitle.map((i) => i.title),
    ["Alpha Signal", "Broken Mirror", "Red Scarf"],
  );
});

check("queryForeshadowings combines search + status + sort", () => {
  const result = queryForeshadowings(items, {
    query: "a",
    status: "paid_off",
    sort: "title",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "fs-3");
});

check("Korean labels: 심음, 회수 예정, 회수 완료", () => {
  assert.equal(FORESHADOWING_STATUS_LABELS.planted, "심음");
  assert.equal(FORESHADOWING_STATUS_LABELS.pending_payoff, "회수 예정");
  assert.equal(FORESHADOWING_STATUS_LABELS.paid_off, "회수 완료");
});

if (failed) {
  console.error("foreshadowing-selftest: FAIL");
  process.exit(1);
}

console.log("foreshadowing-selftest: all assertions passed (PASS)");
process.exit(0);
