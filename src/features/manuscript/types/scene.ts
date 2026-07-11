/**
 * =============================================================================
 * Scene (원고 내 장면)
 * -----------------------------------------------------------------------------
 * Manuscript 는 항상 하나의 긴 문서다. Scene 은 별도 문서가 아니다.
 *
 * - 사용자에게 Scene 번호·구분자를 직접 입력하게 하지 않는다.
 * - 프로그램이 Navigator / 「＋ 새 장면」으로만 Scene 을 관리한다.
 * - 내부 저장은 원고 content 의 자동 마커 + scene_metas(상태·메모·접힘).
 * - id 는 안정 키(scene_001 …). number 는 표시용 1, 2, 3… (순서에 따라 재계산).
 * =============================================================================
 */

/** Scene 구분자 설정 — Settings 에서 확장 가능 (내부 직렬화 전용) */
export interface SceneDelimiterConfig {
  /** 숫자 앞 접두사. 기본 "#" → 내부 `#1`, `#2` (사용자 UI에는 노출하지 않음) */
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
 * - id: 안정 키 `scene_001` (UI·DnD·선택 유지용, 사용자에게 미표시)
 * - number: 표시용 순번 1, 2, 3…
 * - 영속 메타 키는 documentId + scene_number (순서 저장 후 동기화)
 */
export interface Scene {
  /** 안정 ID — 예: scene_001 */
  id: string;
  /** 화면 표시 번호 (1부터, 순서 변경 시 자동 재계산) */
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
