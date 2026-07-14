/**
 * Sky Highlight self-test
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/highlight-marks-selftest.ts
 */

import assert from "node:assert/strict";
import {
  applyPlainEditToHighlightedContent,
  extractHighlights,
  normalizeHighlightContent,
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

  // 깨진 mark 잔여물이 plain 에 새면 태그 제거 (에디터 구멍/밑줄 원인)
  const broken = '안녕 <mark data-ns-hl="sky">세계</mark> <mark>잔여';
  const brokenExtract = extractHighlights(broken);
  assert.equal(brokenExtract.plain.includes("<mark"), false);
  assert.equal(brokenExtract.plain.includes("잔여"), true);
  assert.deepEqual(brokenExtract.ranges, []);

  const normalized = normalizeHighlightContent(withMark);
  assert.equal(stripHighlights(normalized), plain);
  assert.deepEqual(extractHighlights(normalized).ranges, [{ start: 6, end: 11 }]);

  console.log("highlight-marks-selftest: ok");
}

main();
