/**
 * Self-test: expression lemma resolver (활용형 → 기본형)
 * Run: npx --yes tsx src/features/sentence-assistant/lib/__tests__/expression-lemma-selftest.ts
 */

import assert from "node:assert/strict";
import { SYNONYM_INDEX } from "@/data/synonyms";
import {
  clearExpressionLemmaCache,
  generateLemmaCandidates,
  resolveExpressionLemma,
} from "@/features/sentence-assistant/lib/expression-lemma";
import { ExpressionService } from "@/features/sentence-assistant/lib/ExpressionService";

clearExpressionLemmaCache();

const cases: Array<[string, string]> = [
  ["슬펐다", "슬프다"],
  ["좋았다", "좋다"],
  ["걸었다", "걷다"],
  ["바라봤다", "바라보다"],
  ["웃는다", "웃다"],
];

// 인덱스에 없는 표제어도 후보 생성은 되어야 함
for (const [surface, lemma] of cases) {
  const candidates = generateLemmaCandidates(surface);
  assert.ok(
    candidates.includes(lemma),
    `${surface} candidates missing ${lemma}: ${candidates.join(",")}`,
  );
}

// 인덱스에 있는 것만 resolve 가 lemma 로 고정
assert.equal(resolveExpressionLemma("슬펐다", SYNONYM_INDEX), "슬프다");
assert.equal(resolveExpressionLemma("걸었다", SYNONYM_INDEX), "걷다");
assert.equal(resolveExpressionLemma("바라봤다", SYNONYM_INDEX), "바라보다");

// 인덱스에 없는 기본형도 추정되면 lemma 로 사용 (유의어는 비어 있을 수 있음)
assert.equal(resolveExpressionLemma("좋았다", SYNONYM_INDEX), "좋다");
assert.equal(resolveExpressionLemma("웃는다", SYNONYM_INDEX), "웃다");
assert.ok(generateLemmaCandidates("좋았다").includes("좋다"));
assert.ok(generateLemmaCandidates("웃는다").includes("웃다"));

// 캐시: 두 번째 호출도 동일
assert.equal(resolveExpressionLemma("슬펐다", SYNONYM_INDEX), "슬프다");

// 서비스: 슬펐다 → 슬프다 유의어
const sad = ExpressionService.lookupExpressions("슬펐다");
assert.equal(sad.lemma, "슬프다");
assert.ok(sad.synonyms.length > 0);
assert.ok(sad.synonyms.includes("우울하다"));

const walked = ExpressionService.lookupExpressions("걸었다");
assert.equal(walked.lemma, "걷다");
assert.ok(walked.synonyms.length > 0);

const looked = ExpressionService.lookupExpressions("바라봤다");
assert.equal(looked.lemma, "바라보다");
assert.ok(looked.synonyms.length > 0);

// DB에 없는 기본형 → lemma 는 추정, 유의어는 없음
const good = ExpressionService.lookupExpressions("좋았다");
assert.equal(good.lemma, "좋다");
assert.deepEqual(good.synonyms, []);

const smile = ExpressionService.lookupExpressions("웃는다");
assert.equal(smile.lemma, "웃다");
assert.deepEqual(smile.synonyms, []);

console.log("expression-lemma-selftest: ok");
console.log(
  cases
    .map(([s, l]) => `${s}→${resolveExpressionLemma(s, SYNONYM_INDEX)} (want ${l} in candidates)`)
    .join(" | "),
);
