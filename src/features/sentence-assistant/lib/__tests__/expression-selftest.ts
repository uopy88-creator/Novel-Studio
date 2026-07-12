/**
 * Self-test: synonym JSON DB + ExpressionService
 * Run: npx --yes tsx src/features/sentence-assistant/lib/__tests__/expression-selftest.ts
 */

import assert from "node:assert/strict";
import {
  SYNONYM_INDEX,
  buildSynonymIndex,
  getSynonymsFromIndex,
} from "@/data/synonyms";
import { ExpressionService } from "@/features/sentence-assistant/lib/ExpressionService";

function assertSorted(items: string[]) {
  const sorted = [...items].sort((a, b) => a.localeCompare(b, "ko"));
  assert.deepEqual(items, sorted);
}

for (const [key, list] of SYNONYM_INDEX) {
  assert.ok(list.length <= 5, `${key} has more than 5 synonyms`);
  assertSorted(list);
}

const samples = ["행복하다", "슬프다", "걷다", "바라보다"] as const;
for (const word of samples) {
  const synonyms = getSynonymsFromIndex(word);
  assert.ok(synonyms.length > 0, `missing synonyms for ${word}`);
  assert.ok(synonyms.length <= 5);
  assertSorted(synonyms);
  const viaService = ExpressionService.lookupExpressions(word);
  assert.deepEqual(viaService.synonyms, synonyms);
}

assert.deepEqual(
  ExpressionService.lookupExpressions("없는단어xyz").synonyms,
  [],
);

// 카탈로그 병합: 동일 키는 나중 것이 이김
const merged = buildSynonymIndex([
  { 테스트: ["가", "나", "다", "라", "마", "바"] },
  { 테스트: ["사", "아"] },
]);
assert.deepEqual(merged.get("테스트"), ["사", "아"]);

console.log("expression-selftest: ok");
console.log(
  "samples:",
  samples.map((w) => `${w}=[${getSynonymsFromIndex(w).join(", ")}]`).join(" | "),
);
