/**
 * =============================================================================
 * Cache Manager — Sentence Assistant 공통 캐시
 * -----------------------------------------------------------------------------
 * 각 Engine 은 자체 Map 을 만들지 않고 이 매니저만 사용한다.
 * namespace 로 영역을 나눈다 (lemma / dictionary / synonym …).
 *
 * TTL 은 선택 사항. 미지정 시 세션(프로세스) 동안 유지.
 * =============================================================================
 */

export interface CacheSetOptions {
  /** 만료 시간(ms). 없으면 무기한. */
  ttlMs?: number;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

/**
 * 네임스페이스별 인메모리 캐시.
 * 개발자 전용 무효화: clear / clearNamespace
 */
export class CacheManager {
  private readonly store = new Map<string, CacheEntry>();

  private key(namespace: string, key: string): string {
    return `${namespace}::${key}`;
  }

  get<T>(namespace: string, key: string): T | undefined {
    const full = this.key(namespace, key);
    const entry = this.store.get(full);
    if (!entry) return undefined;
    if (entry.expiresAt != null && Date.now() > entry.expiresAt) {
      this.store.delete(full);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(
    namespace: string,
    key: string,
    value: T,
    opts?: CacheSetOptions,
  ): void {
    const expiresAt =
      opts?.ttlMs != null && opts.ttlMs > 0
        ? Date.now() + opts.ttlMs
        : null;
    this.store.set(this.key(namespace, key), { value, expiresAt });
  }

  has(namespace: string, key: string): boolean {
    return this.get(namespace, key) !== undefined;
  }

  delete(namespace: string, key: string): void {
    this.store.delete(this.key(namespace, key));
  }

  /** 한 네임스페이스만 비운다. */
  clearNamespace(namespace: string): void {
    const prefix = `${namespace}::`;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  /** 전체 비우기 (테스트·개발용). */
  clear(): void {
    this.store.clear();
  }
}

/** 앱 전역에서 공유하는 기본 인스턴스 */
export const sharedCacheManager = new CacheManager();

/** Cache 네임스페이스 상수 — 오타 방지 */
export const CACHE_NS = {
  lemma: "lemma",
  /** Sentence Engine 구조화 결과 { original, lemma, normalized, pos } */
  sentence: "sentence",
  /**
   * @deprecated DictionaryResultCache (dictionaryResult) 사용.
   * 하위 호환을 위해 남겨 둔다.
   */
  dictionary: "dictionary",
  /** 국립국어원 검색 최소 결과 — key = Sentence Engine lemma */
  dictionaryResult: "dictionaryResult",
  synonym: "synonym",
} as const;
