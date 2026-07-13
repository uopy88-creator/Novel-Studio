/**
 * Self-test: 공통 Lemma Engine (Dictionary · Synonym 공유)
 * Run: npx --yes tsx src/features/sentence-assistant/engines/lemma/__tests__/lemma-engine-selftest.ts
 */

import assert from "node:assert/strict";
import { SYNONYM_INDEX } from "@/data/synonyms";
import {
  generateLemmaCandidates,
  lemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";

lemmaEngine.clearCache();
sentenceAssistantCore.clearAllCaches();

const expected: Array<[string, string]> = [
  ["걸었다", "걷다"],
  ["걷는다", "걷다"],
  ["걷고", "걷다"],
  ["좋았다", "좋다"],
  ["예뻤다", "예쁘다"],
  ["웃었다", "웃다"],
  ["웃는다", "웃다"],
  ["바라봤다", "바라보다"],
  ["생각했다", "생각하다"],
  ["사랑했다", "사랑하다"],
  ["먹었다", "먹다"],
  ["보였다", "보이다"],
  ["달렸다", "달리다"],
  ["추웠다", "춥다"],
  ["아름다운", "아름답다"],
  ["커졌다", "커지다"],
  ["웃으며", "웃다"],
  ["읽고", "읽다"],
];

for (const [surface, lemma] of expected) {
  const analyzed = lemmaEngine.analyze(surface);
  assert.equal(
    analyzed,
    lemma,
    `analyze(${surface}) → ${analyzed}, want ${lemma} (candidates: ${generateLemmaCandidates(surface).join(",")})`,
  );

  // Core 공용 경로
  assert.equal(
    sentenceAssistantCore.resolveLemma(surface),
    lemma,
    `core.resolveLemma(${surface})`,
  );

  // 동일 입력 재분석은 캐시 — 결과 동일
  assert.equal(lemmaEngine.analyze(surface), lemma);
}

// Synonym 경로: 형태 분석 lemma 또는 인덱스 후보 중 하나 (안정 반환)
for (const [surface, lemma] of expected) {
  const syn = sentenceAssistantCore.lookupSynonyms(surface);
  const candidates = [lemma, surface, ...generateLemmaCandidates(surface)];
  assert.ok(
    candidates.includes(syn.lemma),
    `synonym lemma for ${surface}: got ${syn.lemma}, expected one of ${candidates.join(",")}`,
  );
}

// 인덱스 우선 resolve (유의어 DB에 있는 표제어)
assert.equal(lemmaEngine.resolve("걸었다", SYNONYM_INDEX), "걷다");
assert.equal(lemmaEngine.resolve("바라봤다", SYNONYM_INDEX), "바라보다");

// 실패 시 원문 유지
assert.equal(lemmaEngine.analyze("xyz"), "xyz");

console.log("lemma-engine-selftest: ok");
console.log(
  expected.map(([s]) => `${s}→${lemmaEngine.analyze(s)}`).join(" | "),
);
