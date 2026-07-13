/**
 * =============================================================================
 * Section Registry — Single Source of Truth
 * -----------------------------------------------------------------------------
 * Project 전체에서 Section(id / number / title) 은 여기 하나만 둔다.
 *
 * - Manuscript / useSections 가 관리·발행한다.
 * - Timeline · Characters · Foreshadowing 등은 구독(읽기)만 한다.
 * - Documents(Chapter) 목록을 Section 소스로 쓰지 않는다.
 * =============================================================================
 */

import type { DocumentId, ProjectId } from "@/types/ids";

/** Registry 에 올리는 최소 Section 정보 (연결·표시용) */
export interface SectionRef {
  /** 안정 ID — section_001 (레거시 scene_001 포함). 번호가 아님 */
  id: string;
  /** 현재 Manuscript 안 표시 번호 (1-based, 재정렬 시 바뀔 수 있음) */
  number: number;
  /** 표시 제목 (빈 제목은 "제목 없음") */
  title: string;
}

export type SectionRegistrySource = "idle" | "persisted" | "live";

export interface SectionRegistrySnapshot {
  projectId: ProjectId;
  /** 숨은 primary Manuscript Document — 딥링크용. Section 목록 소스가 아님 */
  primaryDocumentId: DocumentId | null;
  sections: SectionRef[];
  ready: boolean;
  source: SectionRegistrySource;
  /** 스냅샷 세대 — 구독 갱신 비교용 */
  generation: number;
}

type Listener = () => void;

interface StoreEntry {
  snapshot: SectionRegistrySnapshot;
  listeners: Set<Listener>;
}

const stores = new Map<string, StoreEntry>();

function emptySnapshot(projectId: ProjectId): SectionRegistrySnapshot {
  return {
    projectId,
    primaryDocumentId: null,
    sections: [],
    ready: false,
    source: "idle",
    generation: 0,
  };
}

function ensureStore(projectId: ProjectId): StoreEntry {
  let entry = stores.get(projectId);
  if (!entry) {
    entry = {
      snapshot: emptySnapshot(projectId),
      listeners: new Set(),
    };
    stores.set(projectId, entry);
  }
  return entry;
}

function notify(entry: StoreEntry): void {
  for (const listener of entry.listeners) {
    listener();
  }
}

/** 현재 스냅샷 (구독 없이 읽기) */
export function getSectionRegistrySnapshot(
  projectId: ProjectId,
): SectionRegistrySnapshot {
  return ensureStore(projectId).snapshot;
}

/** 스냅샷 변경 구독. 반환값 = unsubscribe */
export function subscribeSectionRegistry(
  projectId: ProjectId,
  listener: Listener,
): () => void {
  const entry = ensureStore(projectId);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export interface PublishSectionsInput {
  sections: SectionRef[];
  primaryDocumentId?: DocumentId | null;
  source: Exclude<SectionRegistrySource, "idle">;
  /**
   * true 이면 live 스냅샷도 덮어쓴다.
   * (창 focus 후 디스크 재동기화)
   */
  force?: boolean;
}

/**
 * Section 목록을 Registry 에 발행한다.
 * Manuscript(live) 또는 hydrate(persisted) 경로에서 호출한다.
 */
export function publishSections(
  projectId: ProjectId,
  input: PublishSectionsInput,
): void {
  const entry = ensureStore(projectId);
  const prev = entry.snapshot;

  // live 가 이미 있으면, stale persisted hydrate 가 덮어쓰지 않게 한다.
  if (
    !input.force &&
    input.source === "persisted" &&
    prev.source === "live" &&
    prev.ready
  ) {
    if (!prev.primaryDocumentId && input.primaryDocumentId) {
      entry.snapshot = {
        ...prev,
        primaryDocumentId: input.primaryDocumentId,
        generation: prev.generation + 1,
      };
      notify(entry);
    }
    return;
  }

  entry.snapshot = {
    projectId,
    primaryDocumentId:
      input.primaryDocumentId !== undefined
        ? input.primaryDocumentId
        : prev.primaryDocumentId,
    sections: input.sections,
    ready: true,
    source: input.source,
    generation: prev.generation + 1,
  };
  notify(entry);
}

/** 테스트·프로젝트 전환 시 스토어 초기화 */
export function resetSectionRegistry(projectId?: ProjectId): void {
  if (projectId) {
    stores.delete(projectId);
    return;
  }
  stores.clear();
}

/** UI 라벨 — `#1 프롤로그` */
export function formatSectionRefLabel(ref: SectionRef): string {
  return `#${ref.number} ${ref.title}`;
}
