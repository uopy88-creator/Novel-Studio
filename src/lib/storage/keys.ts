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

/** 대사 금고 */
export const DIALOGUES_STORAGE_KEY = "novel-studio:dialogues";

/** 메모 (Dashboard 읽기 전용 — CRUD는 아직 없음) */
export const MEMOS_STORAGE_KEY = "novel-studio:memos";

/** 캐릭터 프로필 */
export const CHARACTERS_STORAGE_KEY = "novel-studio:characters";

/** 영감 노트 (Inspiration) */
export const INSPIRATIONS_STORAGE_KEY = "novel-studio:inspirations";

/** 사이드바 접힘 상태 */
export const SIDEBAR_COLLAPSED_KEY = "novel-studio:sidebar-collapsed";

/**
 * 로컬 계정 목록 (이메일·비밀번호 해시).
 * Supabase Auth 전환 전까지 LocalStorage에만 둔다.
 */
export const AUTH_USERS_KEY = "novel-studio:auth-users";

/** 현재 로그인 세션 (재방문 시 자동 로그인) */
export const AUTH_SESSION_KEY = "novel-studio:auth-session";
