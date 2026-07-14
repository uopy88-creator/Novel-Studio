/**
 * Sky Highlight self-test
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/highlight-marks-selftest.ts
 */

import assert from "node:assert/strict";
import {
  applyPlainEditToHighlightedContent,
  extractHighlights,
  serializeHighlights,
  SKY_HIGHLIGHT_COLOR,
  SKY_HIGHLIGHT_OPEN,
  stripHighlights,
  toggleHighlightInContent,
} from "@/features/manuscript/lib/highlight-marks";

function main() {
  assert.equal(SKY_HIGHLIGHT_COLOR, "#BFE8FF");

  const plain = "hello world novel";
  const withMark = toggleHighlightInContent(plain, 6, 11);
  assert.ok(withMark.includes(SKY_HIGHLIGHT_OPEN));
  assert.ok(withMark.includes("data-ns-hl=\"sky\""));
  assert.equal(stripHighlights(withMark), plain);

  const toggledOff = toggleHighlightInContent(withMark, 6, 11);
  assert.equal(toggledOff, plain);

  const partial = toggleHighlightInContent(plain, 0, 5);
  const { ranges } = extractHighlights(partial);
  assert.deepEqual(ranges, [{ start: 0, end: 5 }]);

  // 편집 시 이후 highlight 는 delta 이동, 겹치면 제거
  const base = serializeHighlights("abcdef", [{ start: 3, end: 6 }]);
  const edited = applyPlainEditToHighlightedContent(base, "abXXcdef");
  assert.equal(stripHighlights(edited), "abXXcdef");
  assert.deepEqual(extractHighlights(edited).ranges, [{ start: 5, end: 8 }]);

  const overlapped = applyPlainEditToHighlightedContent(base, "abZef");
  assert.equal(stripHighlights(overlapped), "abZef");
  assert.deepEqual(extractHighlights(overlapped).ranges, []);

  // nested / adjacent merge
  const merged = toggleHighlightInContent(
    toggleHighlightInContent(plain, 0, 5),
    5,
    11,
  );
  assert.deepEqual(extractHighlights(merged).ranges, [{ start: 0, end: 11 }]);

  console.log("highlight-marks-selftest: ok");
}

main();
