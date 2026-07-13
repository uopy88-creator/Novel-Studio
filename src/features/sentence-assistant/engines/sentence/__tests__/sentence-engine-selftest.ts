/**
 * Self-test: Sentence Engine (SSOT 기본형 분석)
 * Run: npm run test:sentence-engine
 */

import assert from "node:assert/strict";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import { sentenceEngine } from "@/features/sentence-assistant/engines/sentence/SentenceEngine";
import type { SentenceAnalysisResult } from "@/features/sentence-assistant/engines/sentence/sentence-types";

sentenceEngine.clearCache();
sentenceAssistantCore.clearAllCaches();

function assertShape(result: SentenceAnalysisResult, label: string) {
  assert.ok(typeof result.original === "string", `${label}.original`);
  assert.ok(typeof result.lemma === "string", `${label}.lemma`);
  assert.ok(typeof result.normalized === "string", `${label}.normalized`);
  assert.ok(typeof result.pos === "string", `${label}.pos`);
}

/** 사용자 예시 + 회귀 */
const expectedLemma: Array<[string, string]> = [
  ["걸었다", "걷다"],
  ["먹었다", "먹다"],
  ["보였다", "보이다"],
  ["달렸다", "달리다"],
  ["예뻤다", "예쁘다"],
  ["추웠다", "춥다"],
  ["아름다운", "아름답다"],
  ["커졌다", "커지다"],
  ["웃으며", "웃다"],
  ["읽고", "읽다"],
  ["읽으며", "읽다"],
  ["달리고", "달리다"],
  // 기존 lemma 회귀
  ["걷는다", "걷다"],
  ["좋았다", "좋다"],
  ["바라봤다", "바라보다"],
  ["생각했다", "생각하다"],
  ["사랑했다", "사랑하다"],
];

for (const [surface, lemma] of expectedLemma) {
  const result = sentenceEngine.analyze(surface);
  assertShape(result, surface);
  assert.equal(result.original, surface);
  assert.equal(
    result.lemma,
    lemma,
    `${surface} → lemma=${result.lemma}, want ${lemma}`,
  );
  assert.equal(result.normalized, surface);

  assert.equal(
    sentenceAssistantCore.resolveLemma(surface),
    lemma,
    `core.resolveLemma(${surface})`,
  );
  assert.equal(
    sentenceAssistantCore.analyzeWord(surface).lemma,
    lemma,
    `core.analyzeWord(${surface})`,
  );

  // 유의어는 인덱스 표제어를 후보 중 고를 수 있음 — 형태 분석과 달라도 안정 반환
  const syn = sentenceAssistantCore.lookupSynonyms(surface);
  assert.ok(syn.lemma.length > 0, `synonym lemma empty for ${surface}`);
  assert.equal(syn.query, surface);
}

// 명사 / 조사 포함 — 실패 없이 원문 또는 안정 결과
const stableSurfaces = [
  "소설",
  "책상",
  "책을",
  "학교에서",
  "AI",
  "Hello",
  "123",
  "…",
  "!!",
];

for (const surface of stableSurfaces) {
  const result = sentenceEngine.analyze(surface);
  assertShape(result, surface);
  assert.ok(result.lemma.length > 0 || surface.trim() === "", surface);
  // 실패 시 원문 유지 (영·숫자·특수문자)
  if (!/[\uAC00-\uD7A3]/.test(surface)) {
    assert.equal(result.lemma, surface, `fallback ${surface}`);
  }
}

// 캐시: 동일 단어 재선택 시 동일 참조 필드
const first = sentenceEngine.analyze("걸었다");
const second = sentenceEngine.analyze("걸었다");
assert.equal(first.lemma, second.lemma);
assert.equal(first.normalized, second.normalized);
assert.equal(first.pos, second.pos);

// 품사 필드 존재 (휴리스틱)
assert.equal(sentenceEngine.analyze("걸었다").pos, "동사");
assert.equal(sentenceEngine.analyze("예뻤다").pos, "형용사");
assert.equal(sentenceEngine.analyze("소설").pos, "명사");
assert.equal(sentenceEngine.analyze("AI").pos, "기타");

console.log("sentence-engine-selftest: ok");
console.log(
  expectedLemma.map(([s, l]) => `${s}→${l}`).join(" | "),
);
