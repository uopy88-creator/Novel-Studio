/**
 * =============================================================================
 * Manuscript Edit History (세션 Undo/Redo)
 * -----------------------------------------------------------------------------
 * 편집 세션 전용 히스토리. Supabase 저장과 무관하다.
 *
 * - Project 단위로 메모리에 유지 (Manuscript ↔ Section 페이지 공유)
 * - 타이핑은 coalesce(묶음) 후 한 단계
 * - Section 생성/이동/삭제 등은 즉시 한 단계
 * - 최소 HISTORY_LIMIT 단계 유지
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";

/** 최소 100단계 유지 */
export const MANUSCRIPT_HISTORY_LIMIT = 100;

/** 타이핑 묶음 대기(ms) — 이 시간 안 연속 입력은 한 Undo 단계 */
export const MANUSCRIPT_HISTORY_COALESCE_MS = 400;

export interface ManuscriptHistorySnapshot {
  content: string;
}

type Listener = () => void;

interface HistoryStore {
  present: string;
  past: ManuscriptHistorySnapshot[];
  future: ManuscriptHistorySnapshot[];
  coalescing: boolean;
  coalesceTimer: ReturnType<typeof setTimeout> | null;
  isRestoring: boolean;
  /** 세션에서 한 번이라도 시드되었는지 (페이지 전환 시 유지) */
  initialized: boolean;
  listeners: Set<Listener>;
}

const stores = new Map<string, HistoryStore>();

function getStore(projectId: ProjectId): HistoryStore {
  let store = stores.get(projectId);
  if (!store) {
    store = {
      present: "",
      past: [],
      future: [],
      coalescing: false,
      coalesceTimer: null,
      isRestoring: false,
      initialized: false,
      listeners: new Set(),
    };
    stores.set(projectId, store);
  }
  return store;
}

function notify(store: HistoryStore): void {
  for (const listener of store.listeners) {
    listener();
  }
}

function trimPast(store: HistoryStore): void {
  while (store.past.length > MANUSCRIPT_HISTORY_LIMIT) {
    store.past.shift();
  }
}

function clearCoalesceTimer(store: HistoryStore): void {
  if (store.coalesceTimer) {
    clearTimeout(store.coalesceTimer);
    store.coalesceTimer = null;
  }
  store.coalescing = false;
}

function bumpCoalesceTimer(store: HistoryStore): void {
  if (store.coalesceTimer) {
    clearTimeout(store.coalesceTimer);
  }
  store.coalescing = true;
  store.coalesceTimer = setTimeout(() => {
    store.coalescing = false;
    store.coalesceTimer = null;
    notify(store);
  }, MANUSCRIPT_HISTORY_COALESCE_MS);
}

export function isManuscriptHistoryInitialized(projectId: ProjectId): boolean {
  return getStore(projectId).initialized;
}

export function getManuscriptHistoryPresent(projectId: ProjectId): string {
  return getStore(projectId).present;
}

/**
 * 최초 1회만 현재 content 로 시드한다.
 * 페이지 전환 시에도 Undo 스택을 유지한다.
 */
export function ensureManuscriptHistorySeed(
  projectId: ProjectId,
  content: string,
): void {
  const store = getStore(projectId);
  if (store.initialized) return;
  clearCoalesceTimer(store);
  store.present = content;
  store.past = [];
  store.future = [];
  store.isRestoring = false;
  store.initialized = true;
  notify(store);
}

/**
 * 로드·버전 복원 등 — 히스토리를 현재 content 로 초기화한다.
 */
export function resetManuscriptHistory(
  projectId: ProjectId,
  content: string,
): void {
  const store = getStore(projectId);
  clearCoalesceTimer(store);
  store.present = content;
  store.past = [];
  store.future = [];
  store.isRestoring = false;
  store.initialized = true;
  notify(store);
}

/** 진행 중인 타이핑 묶음을 끝낸다 (present 를 확정). */
export function flushManuscriptHistoryCoalesce(projectId: ProjectId): void {
  const store = getStore(projectId);
  if (!store.coalescing) return;
  clearCoalesceTimer(store);
  // present 는 이미 최신. past 에는 coalesce 시작 시점에 들어간 이전 값이 있음.
  notify(store);
}

/**
 * 타이핑/삭제/붙여넣기용 — 연속 입력은 한 단계로 묶는다.
 */
export function recordManuscriptEdit(
  projectId: ProjectId,
  nextContent: string,
): void {
  const store = getStore(projectId);
  if (store.isRestoring) {
    store.present = nextContent;
    return;
  }
  if (nextContent === store.present) return;

  if (!store.coalescing) {
    store.past.push({ content: store.present });
    trimPast(store);
    store.future = [];
    store.coalescing = true;
  }

  store.present = nextContent;
  bumpCoalesceTimer(store);
  notify(store);
}

/**
 * Section 생성·이동·삭제 등 — 즉시 한 Undo 단계로 기록한다.
 */
export function recordManuscriptTransaction(
  projectId: ProjectId,
  nextContent: string,
): void {
  const store = getStore(projectId);
  if (store.isRestoring) {
    store.present = nextContent;
    return;
  }

  flushManuscriptHistoryCoalesce(projectId);
  if (nextContent === store.present) return;

  store.past.push({ content: store.present });
  trimPast(store);
  store.future = [];
  store.present = nextContent;
  notify(store);
}

export function canUndoManuscript(projectId: ProjectId): boolean {
  return getStore(projectId).past.length > 0;
}

export function canRedoManuscript(projectId: ProjectId): boolean {
  return getStore(projectId).future.length > 0;
}

export function undoManuscript(
  projectId: ProjectId,
): ManuscriptHistorySnapshot | null {
  const store = getStore(projectId);
  flushManuscriptHistoryCoalesce(projectId);
  if (store.past.length === 0) return null;

  store.future.push({ content: store.present });
  const prev = store.past.pop()!;
  store.present = prev.content;
  notify(store);
  return prev;
}

export function redoManuscript(
  projectId: ProjectId,
): ManuscriptHistorySnapshot | null {
  const store = getStore(projectId);
  flushManuscriptHistoryCoalesce(projectId);
  if (store.future.length === 0) return null;

  store.past.push({ content: store.present });
  trimPast(store);
  const next = store.future.pop()!;
  store.present = next.content;
  notify(store);
  return next;
}

/** Undo/Redo 적용 중 setContent 가 히스토리에 다시 쌓이지 않게 한다. */
export function runWithoutManuscriptHistory(
  projectId: ProjectId,
  fn: () => void,
): void {
  const store = getStore(projectId);
  store.isRestoring = true;
  try {
    fn();
  } finally {
    store.isRestoring = false;
  }
}

export function subscribeManuscriptHistory(
  projectId: ProjectId,
  listener: Listener,
): () => void {
  const store = getStore(projectId);
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

/** 테스트·디버그용 */
export function getManuscriptHistoryDebug(projectId: ProjectId) {
  const store = getStore(projectId);
  return {
    pastLength: store.past.length,
    futureLength: store.future.length,
    present: store.present,
    coalescing: store.coalescing,
  };
}
