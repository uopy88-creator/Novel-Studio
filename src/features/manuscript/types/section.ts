/**
 * =============================================================================
 * Section (원고 내 구간)
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * Manuscript 는 프로젝트당 하나의 긴 문서다. Section 은 별도 문서가 아니다.
 *
 * - Section 구조(추가·이름·순서·상태·아이콘·메모)는 Section 페이지에서 관리한다.
 * - Manuscript 는 집필 전용이며, Section 클릭 시 해당 오프셋으로 스크롤한다.
 * - 사용자에게 Section 번호·구분자를 직접 입력하게 하지 않는다.
 * - 내부 저장은 원고 content 의 자동 마커 + section metas(상태·메모·아이콘·접힘).
 * - id 는 안정 키(`section_001` …). 레거시 `scene_001` 도 파서가 수용한다.
 * - number 는 표시용 1, 2, 3… (순서에 따라 재계산).
 *
 * 과거 이름: Scene (동일 개념). Chapter 는 UI에서 제거되었으며,
 * 숨은 Document 1개가 Manuscript 컨테이너로만 남는다.
 * =============================================================================
 */

/** Section 구분자 설정 — Settings 에서 확장 가능 (내부 직렬화 전용) */
export interface SectionDelimiterConfig {
  /** 숫자 앞 접두사. 기본 "#" → 내부 `#1`, `#2` (사용자 UI에는 노출하지 않음) */
  prefix: string;
}

export const DEFAULT_SECTION_DELIMITER: SectionDelimiterConfig = {
  prefix: "#",
};

/** @deprecated Use SectionDelimiterConfig */
export type SceneDelimiterConfig = SectionDelimiterConfig;
/** @deprecated Use DEFAULT_SECTION_DELIMITER */
export const DEFAULT_SCENE_DELIMITER = DEFAULT_SECTION_DELIMITER;

/** Section 집필 상태 — UI 색은 회색 / 파랑 / 초록만 */
export type SectionStatus = "draft" | "editing" | "done";

/** @deprecated Use SectionStatus */
export type SceneStatus = SectionStatus;

export const SECTION_STATUS_LABELS: Record<SectionStatus, string> = {
  draft: "초안",
  editing: "수정중",
  done: "완료",
};

/** @deprecated Use SECTION_STATUS_LABELS */
export const SCENE_STATUS_LABELS = SECTION_STATUS_LABELS;

/** Section 표시 아이콘 (중요 / 복선 / 대사) */
export type SectionIconId = "important" | "foreshadowing" | "dialogue";

export interface SectionIcons {
  important: boolean;
  foreshadowing: boolean;
  dialogue: boolean;
}

export const EMPTY_SECTION_ICONS: SectionIcons = {
  important: false,
  foreshadowing: false,
  dialogue: false,
};

export const SECTION_ICON_META: Record<
  SectionIconId,
  { emoji: string; label: string }
> = {
  important: { emoji: "★", label: "중요" },
  foreshadowing: { emoji: "📌", label: "복선" },
  dialogue: { emoji: "💬", label: "대사" },
};

/**
 * 파싱된 Section + 메타.
 * - id: 안정 키 `section_001` (또는 레거시 `scene_001`)
 * - number: 표시용 순번 1, 2, 3…
 * - 영속 메타 키는 documentId + section_number (순서 저장 후 동기화)
 */
export interface Section {
  /** 안정 ID — 예: section_001 */
  id: string;
  /** 화면 표시 번호 (1부터, 순서 변경 시 자동 재계산) */
  number: number;
  title: string;
  body: string;
  startOffset: number;
  endOffset: number;
  charCount: number;
  /** 초안 | 수정중 | 완료 */
  status: SectionStatus;
  /** 작가 전용 메모 (원고/export 미포함) */
  memo: string;
  /** 표시 아이콘 (중요 / 복선 / 대사) */
  icons: SectionIcons;
}

/** @deprecated Use Section */
export type Scene = Section;

/** DB / 로컬에 저장하는 Section 메타 (본문 제외) */
export interface SectionMeta {
  id: string;
  projectId: string;
  documentId: string;
  /** 1-based 표시 순번 (저장 키). 레거시 필드명 sceneNumber 와 동일 의미 */
  sectionNumber: number;
  status: SectionStatus;
  memo: string;
  icons: SectionIcons;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 로컬/클라우드에 직렬화될 때 레거시 `sceneNumber` 키도 읽을 수 있게 한다.
 * 새 쓰기는 sectionNumber 를 사용한다.
 */
export type SectionMetaLegacy = SectionMeta & {
  /** @deprecated migrated → sectionNumber */
  sceneNumber?: number;
};

/** @deprecated Use SectionMeta */
export type SceneMeta = SectionMeta & { sceneNumber: number };
