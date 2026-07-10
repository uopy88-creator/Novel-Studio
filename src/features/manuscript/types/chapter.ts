/**
 * =============================================================================
 * Document (문서) — 코드 타입명 Chapter
 * -----------------------------------------------------------------------------
 * 제품/문서에서는 Document, 코드에서는 기존 Chapter 엔티티를 사용한다.
 *
 * Project → Document[] → Manuscript (1:1)
 *
 * Document = 목록·메타 (제목, 종류, 순서)
 * Manuscript = 실제 본문
 * =============================================================================
 */

import type { ChapterId, ProjectId, Timestamps } from "@/types/ids";

/**
 * Document 종류.
 * 작품 유형(소설/시/에세이/기타)을 Document 단위로 고를 수 있다.
 */
export type DocumentKind = "novel" | "poem" | "essay" | "other";

/** UI에 보여줄 한글 라벨 */
export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  novel: "소설",
  poem: "시",
  essay: "에세이",
  other: "기타",
};

export const DOCUMENT_KIND_OPTIONS: DocumentKind[] = [
  "novel",
  "poem",
  "essay",
  "other",
];

/** 새 Document 기본 제목 */
export const DEFAULT_DOCUMENT_TITLE = "새 문서";

/**
 * 챕터 집필 상태.
 * 세계관 "완성도"가 아니라, 이 문서를 쓰는 진행 상태를 나타낸다.
 */
export type ChapterStatus =
  | "planned"
  | "writing"
  | "draft_done"
  | "revising"
  | "done";

/**
 * Document 엔티티 (코드명 Chapter).
 *
 * 관계
 * - Project 1 ── * Document
 * - Document 1 ── 1 Manuscript
 */
export interface Chapter extends Timestamps {
  id: ChapterId;

  /** 소속 작품 */
  projectId: ProjectId;

  /** 문서 제목 */
  title: string;

  /**
   * 문서 종류 (소설 / 시 / 에세이 / 기타)
   * 구버전 LocalStorage에 없으면 읽을 때 novel로 보정한다.
   */
  kind: DocumentKind;

  /**
   * 작품 안에서의 순서 (0부터).
   * UI 번호는 정렬 후 index + 1.
   */
  sortOrder: number;

  /** 집필 상태 */
  status: ChapterStatus;

  /** 짧은 설명 (선택) */
  summary?: string;

  /** 분량 캐시 (공백 제외 글자수, Manuscript 저장 시 동기화) */
  wordCount: number;
}

/** 제품 언어 별칭 */
export type Document = Chapter;
