/**
 * =============================================================================
 * Scene (원고 내 장면)
 * -----------------------------------------------------------------------------
 * 본문 구조는 Manuscript content 의 #1 #2 … 구분자로 파싱합니다.
 * status / memo / 접힘은 scene_metas 테이블에 따로 저장합니다 (export 제외).
 * =============================================================================
 */

/** Scene 구분자 설정 — Settings 에서 확장 가능 */
export interface SceneDelimiterConfig {
  /** 숫자 앞 접두사. 기본 "#" → `#1`, `#2` */
  prefix: string;
}

export const DEFAULT_SCENE_DELIMITER: SceneDelimiterConfig = {
  prefix: "#",
};

/** Scene 집필 상태 — UI 색은 회색 / 파랑 / 초록만 */
export type SceneStatus = "draft" | "editing" | "done";

export const SCENE_STATUS_LABELS: Record<SceneStatus, string> = {
  draft: "초안",
  editing: "수정중",
  done: "완료",
};

/**
 * 파싱된 Scene + 메타.
 * id 는 UI용이며, 영속 키는 documentId + scene_number 입니다.
 */
export interface Scene {
  id: string;
  number: number;
  title: string;
  body: string;
  startOffset: number;
  endOffset: number;
  charCount: number;
  /** 초안 | 수정중 | 완료 */
  status: SceneStatus;
  /** 작가 전용 메모 (원고/export 미포함) */
  memo: string;
}

/** DB / 로컬에 저장하는 Scene 메타 (본문 제외) */
export interface SceneMeta {
  id: string;
  projectId: string;
  documentId: string;
  sceneNumber: number;
  status: SceneStatus;
  memo: string;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}
