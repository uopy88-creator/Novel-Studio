/**
 * Self-test: Manuscript text color markup
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/manuscript-markup-selftest.ts
 */

import assert from "node:assert/strict";
import {
  applyManuscriptFgColor,
  parseManuscriptColorRuns,
  reconcileVisibleEdit,
  stripManuscriptMarkup,
  stripManuscriptMarkupWithMap,
} from "../manuscript-markup";

const colored = applyManuscriptFgColor("hello world", 6, 11, "b");
assert.equal(colored, "hello ·ns:fg:b·world·ns:/fg·");
assert.equal(stripManuscriptMarkup(colored), "hello world");

const runs = parseManuscriptColorRuns(colored);
assert.equal(runs.length, 2);
assert.equal(runs[0].text, "hello ");
assert.equal(runs[0].color, "k");
assert.equal(runs[1].text, "world");
assert.equal(runs[1].color, "b");

// 검정 = 마커 제거
const map = stripManuscriptMarkupWithMap(colored);
const reset = applyManuscriptFgColor(
  colored,
  map.toStorageOffset(6),
  map.toStorageOffset(11),
  "k",
);
assert.equal(reset, "hello world");

// 색 구간 안에 글자 삽입 → 색 유지
const inserted = reconcileVisibleEdit(colored, "hello woXorld");
assert.equal(stripManuscriptMarkup(inserted), "hello woXorld");
assert.equal(
  inserted,
  "hello ·ns:fg:b·woXorld·ns:/fg·",
);

const red = applyManuscriptFgColor("abc", 0, 3, "r");
assert.equal(red, "·ns:fg:r·abc·ns:/fg·");
const yellow = applyManuscriptFgColor(
  red,
  0,
  red.length,
  "y",
);
assert.equal(stripManuscriptMarkup(yellow), "abc");
assert.ok(yellow.includes("·ns:fg:y·"));
assert.equal(yellow.includes("·ns:fg:r·"), false);

console.log("manuscript-markup-selftest: ok");
