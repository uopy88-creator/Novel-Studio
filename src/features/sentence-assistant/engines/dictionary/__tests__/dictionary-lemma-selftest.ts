/**
 * Self-test: Dictionary lemma-first lookup (국립국어원 검색 경로)
 * Run: npm run test:dictionary-lemma
 *
 * 실제 API 없이 mock DictionaryEngine 으로
 * lemma 우선 → original 폴백 → 캐시·오류 격리를 검증한다.
 */

import assert from "node:assert/strict";
import { CacheManager } from "@/features/sentence-assistant/cache/CacheManager";
import { SentenceAssistantCore } from "@/features/sentence-assistant/core/SentenceAssistantCore";
import type {
  DictionaryLookupResult,
} from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { DictionaryEngine } from "@/features/sentence-assistant/engines/dictionary/DictionaryEngine";
import { LemmaEngine } from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import { SentenceEngine } from "@/features/sentence-assistant/engines/sentence/SentenceEngine";

/** mock: q → 결과. 호출 순서를 calls 에 기록 */
class MockDictionaryEngine extends DictionaryEngine {
  readonly calls: string[] = [];
  private readonly table: Map<string, DictionaryLookupResult>;

  constructor(entries: Record<string, DictionaryLookupResult>) {
    super();
    this.table = new Map(Object.entries(entries));
  }

  override async lookup(rawQuery: string): Promise<DictionaryLookupResult> {
    const q = rawQuery.trim();
    this.calls.push(q);
    const hit = this.table.get(q);
    if (hit) return structuredClone(hit);
    return { status: "not_found", query: q };
  }
}

function found(word: string, definition = `${word} 뜻`): DictionaryLookupResult {
  const senses = [{ definition, pos: "동사" as string | null }];
  return {
    status: "found",
    query: word,
    entry: {
      query: word,
      word,
      pos: "동사",
      definition,
      link: null,
      senses,
    },
  };
}

const cache = new CacheManager();
const lemmaEngine = new LemmaEngine(cache);
const sentenceEngine = new SentenceEngine(lemmaEngine, cache);

const mockDict = new MockDictionaryEngine(
  {
    걷다: found("걷다", "발을 번갈아 옮겨 움직이다."),
    먹다: found("먹다"),
    보이다: found("보이다"),
    읽다: found("읽다"),
    예쁘다: found("예쁘다"),
    춥다: found("춥다"),
    아름답다: found("아름답다"),
    커지다: found("커지다"),
    달리다: found("달리다"),
    웃다: found("웃다"),
    소설: found("소설", "이야기 문학."),
    특수원문만: found("특수원문만", "원문 폴백 테스트"),
  },
);

const core = new SentenceAssistantCore({
  cache,
  lemma: lemmaEngine,
  sentence: sentenceEngine,
  dictionary: mockDict,
});

const lemmaCases: Array<[string, string]> = [
  ["걸었다", "걷다"],
  ["먹었다", "먹다"],
  ["보였다", "보이다"],
  ["읽으며", "읽다"],
  ["예뻤다", "예쁘다"],
  ["추웠다", "춥다"],
  ["아름다운", "아름답다"],
  ["커졌다", "커지다"],
  ["달리고", "달리다"],
  ["웃으며", "웃다"],
];

async function main() {
  for (const [surface, lemma] of lemmaCases) {
    mockDict.calls.length = 0;
    const result = await core.lookupDefinition(surface);
    assert.equal(result.status, "found", `${surface} status`);
    assert.equal(result.matchedBy, "lemma", `${surface} matchedBy`);
    assert.equal(result.lemma, lemma, `${surface} lemma`);
    assert.equal(result.original, surface, `${surface} original`);
    assert.equal(result.query, lemma, `${surface} query`);
    assert.equal(result.entry?.word, lemma, `${surface} word title`);
    assert.equal(mockDict.calls[0], lemma, `${surface} first API q`);
    assert.ok(
      !mockDict.calls.includes(surface) || surface === lemma,
      `${surface} should not search original when lemma hits`,
    );
  }

  // 명사
  {
    mockDict.calls.length = 0;
    const result = await core.lookupDefinition("소설");
    assert.equal(result.status, "found");
    assert.equal(result.matchedBy, "lemma");
    assert.equal(result.entry?.word, "소설");
  }

  // lemma 없음 → original 폴백
  {
    const sparseCache = new CacheManager();
    const sparseLemma = new LemmaEngine(sparseCache);
    const sparseSentence = new SentenceEngine(sparseLemma, sparseCache);
    const sparseMock = new MockDictionaryEngine({
      걸었다: found("걸었다", "원문으로만 등록"),
    });
    const sparseCore = new SentenceAssistantCore({
      cache: sparseCache,
      lemma: sparseLemma,
      sentence: sparseSentence,
      dictionary: sparseMock,
    });
    const result = await sparseCore.lookupDefinition("걸었다");
    assert.equal(result.status, "found");
    assert.equal(result.matchedBy, "original");
    assert.equal(result.lemma, "걷다");
    assert.equal(result.original, "걸었다");
    assert.deepEqual(sparseMock.calls, ["걷다", "걸었다"]);
  }

  // 둘 다 없음
  {
    mockDict.calls.length = 0;
    const result = await core.lookupDefinition("없는단어xyz");
    assert.equal(result.status, "not_found");
    assert.ok(result.lemma);
    assert.equal(result.entry, undefined);
  }

  // 영어 / 숫자 — 오류 없이 검색 시도
  for (const surface of ["AI", "Hello", "123"]) {
    mockDict.calls.length = 0;
    const result = await core.lookupDefinition(surface);
    assert.equal(result.status, "not_found");
    assert.equal(result.lemma, surface);
    assert.equal(mockDict.calls[0], surface);
  }

  // 동일 단어 반복 — lemma 캐시로 API 재호출 없음
  {
    core.dictionaryResultCache.clear();
    mockDict.calls.length = 0;
    await core.lookupDefinition("예뻤다");
    assert.equal(mockDict.calls.length, 1);
    assert.equal(mockDict.calls[0], "예쁘다");
    mockDict.calls.length = 0;
    await core.lookupDefinition("예뻤다");
    await core.lookupDefinition("예쁘다");
    assert.equal(mockDict.calls.length, 0, "lemma cache should skip API");
    assert.equal(core.analyzeWord("예뻤다").lemma, "예쁘다");
  }

  // API 오류 격리
  {
    class ErrorDict extends DictionaryEngine {
      override async lookup(): Promise<DictionaryLookupResult> {
        return { status: "error", query: "걷다" };
      }
    }
    const errCache = new CacheManager();
    const errCore = new SentenceAssistantCore({
      cache: errCache,
      lemma: new LemmaEngine(errCache),
      sentence: new SentenceEngine(new LemmaEngine(errCache), errCache),
      dictionary: new ErrorDict(),
    });
    const result = await errCore.lookupDefinition("걸었다");
    assert.equal(result.status, "error");
    const syn = errCore.lookupSynonyms("걸었다");
    assert.equal(syn.lemma, "걷다");
  }

  console.log("dictionary-lemma-selftest: ok");
  console.log(lemmaCases.map(([s, l]) => `${s}→${l}`).join(" | "));
}

void main();
