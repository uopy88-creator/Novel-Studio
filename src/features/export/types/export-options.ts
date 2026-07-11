/**
 * =============================================================================
 * Export 옵션 · 범위 · 형식
 * -----------------------------------------------------------------------------
 * 자동 저장/버전 Snapshot 과 무관. 사용자가 명시적으로 내보낼 때만 사용한다.
 * =============================================================================
 */

/** 파일 형식 */
export type ExportFormat = "txt" | "docx" | "pdf";

/**
 * Export 대상 범위
 * - manuscript: 현재 Document 전체 원고
 * - scenes: 선택한 Scene만
 * - project: 프로젝트의 모든 Document
 */
export type ExportScope = "manuscript" | "scenes" | "project";

/**
 * Export 옵션 체크박스
 *
 * - includeSceneDelimiters: 장면 구분(#1 …) 포함
 * - excludeSceneMemos: 장면 메모 제외 (기본 true — 작가만 보는 메모)
 * - excludeWritingVault: Writing Vault 부록 제외
 * - includeInspirationNotes: Inspiration 주석 부록 포함
 */
export interface ExportOptions {
  includeSceneDelimiters: boolean;
  excludeSceneMemos: boolean;
  excludeWritingVault: boolean;
  includeInspirationNotes: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeSceneDelimiters: true,
  excludeSceneMemos: true,
  excludeWritingVault: true,
  includeInspirationNotes: false,
};

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  txt: "TXT",
  docx: "DOCX",
  pdf: "PDF",
};

export const EXPORT_SCOPE_LABELS: Record<ExportScope, string> = {
  manuscript: "전체 원고",
  scenes: "선택한 Scene만",
  project: "프로젝트 전체",
};

/** 문서 한 덩어리 (제목 + 본문 블록들) */
export interface ExportDocumentBlock {
  title: string;
  /** 이미 옵션이 반영된 본문 텍스트 */
  body: string;
}

/** 빌더가 만든 최종 페이로드 — 각 포맷 생성기가 소비 */
export interface ExportPayload {
  /** 파일명에 쓸 작품/문서 제목 */
  title: string;
  /** 프로젝트 제목 (헤더용) */
  projectTitle: string;
  documents: ExportDocumentBlock[];
  /** 옵션에 따라 붙는 부록 (Writing Vault / Inspiration) */
  appendix: string;
  options: ExportOptions;
  generatedAt: string;
}
