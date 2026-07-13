/**
 * =============================================================================
 * Dictionary Result Cache — 국립국어원 검색 결과 (lemma 키)
 * -----------------------------------------------------------------------------
 * Sentence Assistant 공통 메모리 캐시.
 * - Key: Sentence Engine lemma (반드시)
 * - Value: 최소 데이터만 (lemma, senses≤2, pos, lookedUpAt)
 * - LocalStorage / DB 없음. 새로고침 시 초기화.
 * - not_found 도 캐시해 반복 API 호출을 막는다.
 * - error 는 캐시하지 않는다 (재시도 가능).
 *
 * 향후 Show/Tell · 유의어 · 표현 추천도 이 모듈 패턴을 재사용할 수 있다.
 * =============================================================================
 */

import {
  CACHE_NS,
  type CacheManager,
  sharedCacheManager,
} from "@/features/sentence-assistant/cache/CacheManager";
import {
  DICTIONARY_MAX_SENSES,
  type DictionaryLookupResult,
  type DictionaryMatchedBy,
  type DictionarySense,
} from "@/features/sentence-assistant/engines/dictionary/dictionary-types";

/** 캐시에 저장하는 최소 sense */
export interface DictionaryCachedSense {
  definition: string;
  pos: string | null;
}

/**
 * 캐시 레코드 — API 원본 JSON 전체를 저장하지 않는다.
 */
export interface DictionaryCacheRecord {
  lemma: string;
  status: "found" | "not_found";
  /** 뜻 목록 (최대 2개). not_found 이면 빈 배열 */
  senses: DictionaryCachedSense[];
  /** 대표 품사 (첫 sense). 없으면 null */
  pos: string | null;
  /** 조회 시각 (ms epoch) */
  lookedUpAt: number;
}

function normalizeLemmaKey(lemma: string): string {
  return lemma.trim();
}

function clipSenses(senses: DictionarySense[]): DictionaryCachedSense[] {
  return senses.slice(0, DICTIONARY_MAX_SENSES).map((s) => ({
    definition: s.definition.trim(),
    pos: s.pos?.trim() || null,
  }));
}

function defaultLink(lemma: string): string {
  return `https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=${encodeURIComponent(lemma)}`;
}

/**
 * DictionaryLookupResult → 캐시 레코드.
 * error 상태는 null (캐시하지 않음).
 */
export function toDictionaryCacheRecord(
  lemma: string,
  result: DictionaryLookupResult,
): DictionaryCacheRecord | null {
  const key = normalizeLemmaKey(lemma);
  if (!key) return null;

  if (result.status === "error") return null;

  if (result.status === "not_found" || !result.entry) {
    return {
      lemma: key,
      status: "not_found",
      senses: [],
      pos: null,
      lookedUpAt: Date.now(),
    };
  }

  const senses = clipSenses(
    result.entry.senses?.length
      ? result.entry.senses
      : [
          {
            definition: result.entry.definition,
            pos: result.entry.pos,
          },
        ],
  );

  return {
    lemma: key,
    status: "found",
    senses,
    pos: senses[0]?.pos ?? null,
    lookedUpAt: Date.now(),
  };
}

/**
 * 캐시 레코드 → UI/Core 가 쓰는 LookupResult.
 */
export function fromDictionaryCacheRecord(
  record: DictionaryCacheRecord,
  options: {
    original: string;
    matchedBy?: DictionaryMatchedBy;
  },
): DictionaryLookupResult {
  const { original, matchedBy = "lemma" } = options;
  const lemma = record.lemma;

  if (record.status === "not_found" || record.senses.length === 0) {
    return {
      status: "not_found",
      query: lemma,
      lemma,
      original,
    };
  }

  const senses = clipSenses(record.senses);
  return {
    status: "found",
    query: lemma,
    lemma,
    original,
    matchedBy,
    entry: {
      query: lemma,
      word: lemma,
      pos: senses[0]?.pos ?? record.pos,
      definition: senses[0]?.definition ?? "",
      link: defaultLink(lemma),
      senses,
    },
  };
}

/**
 * lemma 키 사전 결과 캐시 (독립 모듈).
 */
export class DictionaryResultCache {
  constructor(private readonly store: CacheManager = sharedCacheManager) {}

  get(lemma: string): DictionaryCacheRecord | undefined {
    const key = normalizeLemmaKey(lemma);
    if (!key) return undefined;
    return this.store.get<DictionaryCacheRecord>(
      CACHE_NS.dictionaryResult,
      key,
    );
  }

  has(lemma: string): boolean {
    return this.get(lemma) !== undefined;
  }

  set(record: DictionaryCacheRecord): void {
    const key = normalizeLemmaKey(record.lemma);
    if (!key) return;
    this.store.set(CACHE_NS.dictionaryResult, key, {
      ...record,
      lemma: key,
      senses: clipSenses(record.senses),
    });
  }

  /** LookupResult 를 lemma 키로 저장. error 는 무시. */
  setFromLookup(lemma: string, result: DictionaryLookupResult): void {
    const record = toDictionaryCacheRecord(lemma, result);
    if (record) this.set(record);
  }

  clear(): void {
    this.store.clearNamespace(CACHE_NS.dictionaryResult);
  }
}

export const dictionaryResultCache = new DictionaryResultCache();
