/**
 * Self-test: expression replace offset helpers (순수 문자열 splice)
 * Run: npx --yes tsx src/features/sentence-assistant/lib/__tests__/expression-replace-selftest.ts
 */

import assert from "node:assert/strict";

function replaceAt(
  content: string,
  start: number,
  end: number,
  synonym: string,
): { next: string; caret: number; selStart: number; selEnd: number } {
  const next = content.slice(0, start) + synonym + content.slice(end);
  const selStart = start;
  const selEnd = start + synonym.length;
  return { next, caret: selEnd, selStart, selEnd };
}

const base = "그는 슬프다 그리고 또 슬프다";
// 두 번째 "슬프다" 만 교체 (offset 13)
const first = base.indexOf("슬프다");
const second = base.indexOf("슬프다", first + 1);
assert.ok(second > first);

const result = replaceAt(base, second, second + "슬프다".length, "우울하다");
assert.equal(result.next, "그는 슬프다 그리고 또 우울하다");
assert.equal(result.caret, result.selEnd);
assert.equal(result.next.slice(result.selStart, result.selEnd), "우울하다");
// 첫 번째 슬프다는 유지
assert.ok(result.next.startsWith("그는 슬프다"));

console.log("expression-replace-selftest: ok");
