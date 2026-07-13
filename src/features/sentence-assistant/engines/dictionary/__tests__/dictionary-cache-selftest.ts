/**
 * Self-test: Dictionary Result Cache (lemma 키, 최소 데이터)
 * Run: npm run test:dictionary-cache
 */

import assert from "node:assert/strict";
import { CacheManager } from "@/features/sentence-assistant/cache/CacheManager";
import {
  DictionaryResultCache,
  fromDictionaryCacheRecord,
  toDictionaryCacheRecord,
} from "@/features/sentence-assistant/cache/dictionary-result-cache";
import { SentenceAssistantCore } from "@/features/sentence-assistant/core/SentenceAssistantCore";
import type { DictionaryLookupResult } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { DictionaryEngine } from "@/features/sentence-assistant/engines/dictionary/DictionaryEngine";
import { LemmaEngine } from "@/features/sentence-assistant/engines/lemma/LemmaEngine";
import { SentenceEngine } from "@/features/sentence-assistant/engines/sentence/SentenceEngine";

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

function found(
  word: string,
  senses: Array<{ definition: string; pos: string | null }>,
): DictionaryLookupResult {
  return {
    status: "found",
    query: word,
    entry: {
      query: word,
      word,
      pos: senses[0]?.pos ?? null,
      definition: senses[0]?.definition ?? "",
      link: null,
      senses,
    },
  };
}

async function main() {
  const cache = new CacheManager();
  const dictCache = new DictionaryResultCache(cache);
  const mock = new MockDictionaryEngine({
    걷다: found("걷다", [
      { definition: "발을 번갈아 옮겨 움직이다.", pos: "동사" },
    ]),
    신: found("신", [
      { definition: "사람을 초월한 절대적 존재.", pos: "명사" },
      { definition: "발에 신는 물건.", pos: "명사" },
      { definition: "세 번째는 캐시에도 최대 2개.", pos: "명사" },
    ]),
  });

  const core = new SentenceAssistantCore({
    cache,
    lemma: new LemmaEngine(cache),
    sentence: new SentenceEngine(new LemmaEngine(cache), cache),
    dictionary: mock,
    dictionaryResultCache: dictCache,
  });

  // 1) 같은 단어 / 같은 lemma 반복 → API 1회
  mock.calls.length = 0;
  const first = await core.lookupDefinition("걸었다");
  assert.equal(first.status, "found");
  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0], "걷다");

  mock.calls.length = 0;
  const second = await core.lookupDefinition("걸었다");
  const third = await core.lookupDefinition("걷다");
  assert.equal(mock.calls.length, 0, "repeat must use lemma cache");
  assert.equal(second.status, "found");
  assert.equal(third.status, "found");
  assert.equal(second.entry?.senses.length, 1);

  // 캐시 레코드 최소 필드
  const record = dictCache.get("걷다");
  assert.ok(record);
  assert.equal(record!.lemma, "걷다");
  assert.equal(record!.status, "found");
  assert.ok(typeof record!.lookedUpAt === "number");
  assert.equal(record!.pos, "동사");
  assert.equal(record!.senses.length, 1);

  // 2) 다른 단어
  mock.calls.length = 0;
  await core.lookupDefinition("신");
  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0], "신");

  // 3) 다의어 — 캐시에 최대 2 sense
  const shin = dictCache.get("신");
  assert.ok(shin);
  assert.equal(shin!.senses.length, 2);
  const shinLookup = fromDictionaryCacheRecord(shin!, { original: "신" });
  assert.equal(shinLookup.entry?.senses.length, 2);

  // 4) 검색 결과 없음도 캐시
  mock.calls.length = 0;
  const missing = await core.lookupDefinition("asdfasdf");
  assert.equal(missing.status, "not_found");
  assert.equal(mock.calls.length, 1);
  mock.calls.length = 0;
  const missingAgain = await core.lookupDefinition("asdfasdf");
  assert.equal(missingAgain.status, "not_found");
  assert.equal(mock.calls.length, 0);
  assert.equal(dictCache.get("asdfasdf")?.status, "not_found");

  // 5) error 는 캐시하지 않음
  {
    let attempts = 0;
    class FlakyDict extends DictionaryEngine {
      override async lookup(): Promise<DictionaryLookupResult> {
        attempts += 1;
        if (attempts === 1) return { status: "error", query: "임시" };
        return found("임시", [{ definition: "복구됨", pos: "명사" }]);
      }
    }
    const c = new CacheManager();
    const flakyCore = new SentenceAssistantCore({
      cache: c,
      dictionary: new FlakyDict(),
      dictionaryResultCache: new DictionaryResultCache(c),
    });
    const err = await flakyCore.lookupDefinition("임시");
    assert.equal(err.status, "error");
    assert.equal(flakyCore.dictionaryResultCache.has("임시"), false);
    const ok = await flakyCore.lookupDefinition("임시");
    assert.equal(ok.status, "found");
    assert.equal(attempts, 2);
  }

  // 6) 동시 요청 — inflight 로 API 1회
  {
    const c = new CacheManager();
    let apiCalls = 0;
    class SlowDict extends DictionaryEngine {
      override async lookup(q: string): Promise<DictionaryLookupResult> {
        apiCalls += 1;
        await new Promise((r) => setTimeout(r, 20));
        return found(q, [{ definition: `${q} 뜻`, pos: "명사" }]);
      }
    }
    const parallelCore = new SentenceAssistantCore({
      cache: c,
      dictionary: new SlowDict(),
      dictionaryResultCache: new DictionaryResultCache(c),
    });
    const [a, b] = await Promise.all([
      parallelCore.lookupDefinition("동시"),
      parallelCore.lookupDefinition("동시"),
    ]);
    assert.equal(apiCalls, 1);
    assert.equal(a.status, "found");
    assert.equal(b.status, "found");
  }

  // 7) clear = 새로고침과 동일하게 메모리 비움 → 다시 API
  mock.calls.length = 0;
  core.clearAllCaches();
  // sentence/lemma 캐시도 비웠으므로 재구성
  const afterClear = new SentenceAssistantCore({
    cache,
    lemma: new LemmaEngine(cache),
    sentence: new SentenceEngine(new LemmaEngine(cache), cache),
    dictionary: mock,
    dictionaryResultCache: dictCache,
  });
  assert.equal(dictCache.has("걷다"), false);
  await afterClear.lookupDefinition("걸었다");
  assert.ok(mock.calls.includes("걷다"));

  // 8) toDictionaryCacheRecord — error → null
  assert.equal(
    toDictionaryCacheRecord("x", { status: "error", query: "x" }),
    null,
  );

  console.log("dictionary-cache-selftest: ok");
}

void main();
