/**
 * =============================================================================
 * LocalStorage 키 중앙 관리
 * -----------------------------------------------------------------------------
 * 모든 기능이 같은 문자열을 쓰도록 한곳에 모은다.
 * 키 이름을 바꾸면 기존 사용자 데이터가 끊기므로 함부로 변경하지 않는다.
 * =============================================================================
 */

/** 작품 목록 */
export const PROJECTS_STORAGE_KEY = "novel-studio:projects";

/**
 * Document(목차) 목록.
 * 제품 용어는 Document이지만 저장 키는 하위 호환을 위해 chapters 유지.
 */
export const CHAPTERS_STORAGE_KEY = "novel-studio:chapters";

/** 원고 본문 */
export const MANUSCRIPTS_STORAGE_KEY = "novel-studio:manuscripts";

/** 원고 버전 스냅샷 (명시적 저장 — 자동 저장과 별개) */
export const MANUSCRIPT_VERSIONS_STORAGE_KEY =
  "novel-studio:manuscript-versions";

/** 대사 금고 */
export const DIALOGUES_STORAGE_KEY = "novel-studio:dialogues";

/** 메모 (Dashboard 읽기 · CRUD 준비 — LocalStorage 백업 전용 키) */
export const MEMOS_STORAGE_KEY = "novel-studio:memos";

/**
 * Section 구분자 설정 (#1, #2 …) — Settings 연동용.
 * 키 문자열은 하위 호환을 위해 scene-delimiter-settings 유지.
 */
export const SECTION_DELIMITER_SETTINGS_KEY =
  "novel-studio:scene-delimiter-settings";

/** @deprecated Use SECTION_DELIMITER_SETTINGS_KEY */
export const SCENE_DELIMITER_SETTINGS_KEY = SECTION_DELIMITER_SETTINGS_KEY;

/** 캐릭터 프로필 */
export const CHARACTERS_STORAGE_KEY = "novel-studio:characters";

/** 영감 노트 (Inspiration) */
export const INSPIRATIONS_STORAGE_KEY = "novel-studio:inspirations";

/** 어휘 금고 (Word Treasury) — LocalStorage 백업 전용 */
export const WORD_TREASURY_STORAGE_KEY = "novel-studio:word-treasury";

/** 복선 (Foreshadowing) — LocalStorage 백업 전용 */
export const FORESHADOWINGS_STORAGE_KEY = "novel-studio:foreshadowings";

/**
 * Section 상태·메모·접힘 (원고와 분리, export 제외).
 * 새 키. 읽기 시 `SCENE_METAS_STORAGE_KEY`(레거시)에서 마이그레이션한다.
 */
export const SECTION_METAS_STORAGE_KEY = "novel-studio:section-metas";

/** @deprecated Use SECTION_METAS_STORAGE_KEY — 마이그레이션 소스 */
export const SCENE_METAS_STORAGE_KEY = "novel-studio:scene-metas";

/**
 * @deprecated Migration 완료는 LocalStorage 플래그로 판단하지 않는다.
 * Section 구조 여부(`isAlreadySectionStructure`)로만 판단한다.
 * 하위 호환을 위해 키 문자열만 남긴다 — 신규 코드에서 쓰지 말 것.
 */
export const SECTIONS_MIGRATION_FLAG_KEY =
  "novel-studio:sections-migration-done";

/**
 * 원고 Auto Recovery 임시 초안 (LocalStorage ONLY).
 * Supabase·WORK_DATA_BACKUP 에 포함하지 않는다.
 */
export const MANUSCRIPT_RECOVERY_STORAGE_KEY =
  "novel-studio:manuscript-recovery";

/** 사이드바 접힘 상태 */
export const SIDEBAR_COLLAPSED_KEY = "novel-studio:sidebar-collapsed";

/**
 * 프로젝트 전체 검색 — 최근 검색어
 * 값: { projectId, entries: [{ query, searchedAt }] }[]
 */
export const SEARCH_RECENT_STORAGE_KEY = "novel-studio:search-recent";

/** Timeline 사건 (시간순 정리) */
export const TIMELINE_EVENTS_STORAGE_KEY = "novel-studio:timeline-events";

/**
 * 앱 전역 사용자 설정 (폰트·폭·자동저장·테마·Export 기본값)
 */
export const USER_SETTINGS_STORAGE_KEY = "novel-studio:user-settings";

/**
 * 로컬 계정 목록 (이메일·비밀번호 해시).
 * Supabase Auth 전환 전까지 LocalStorage에만 둔다.
 */
export const AUTH_USERS_KEY = "novel-studio:auth-users";

/** 현재 로그인 세션 (재방문 시 자동 로그인) */
export const AUTH_SESSION_KEY = "novel-studio:auth-session";
