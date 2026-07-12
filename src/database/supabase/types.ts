/**
 * =============================================================================
 * Database 테이블 타입 (Supabase Postgres ↔ TypeScript)
 * -----------------------------------------------------------------------------
 * snake_case = DB 컬럼, camelCase = 앱 도메인 (mappers.ts 에서 변환)
 * =============================================================================
 */

/** projects */
export interface DbProjectRow {
  id: string;
  user_id: string;
  title: string;
  premise: string | null;
  /** 작품 종류 — novel | poem | essay | other (마이그레이션 전 null 가능) */
  type?: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** documents (앱의 Chapter / Document) */
export interface DbDocumentRow {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  kind: string;
  sort_order: number;
  status: string;
  summary: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

/** manuscripts */
export interface DbManuscriptRow {
  id: string;
  project_id: string;
  document_id: string;
  user_id: string;
  content: string;
  plain_text: string;
  word_count: number;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

/** writing_vault (Writing Vault / 구 dialogues) */
export interface DbDialogueRow {
  id: string;
  project_id: string;
  user_id: string;
  /** sentence | word | idea */
  entry_type: string;
  title: string;
  content: string;
  tags: string[];
  reference_work_title: string;
  reference_author: string;
  reference_memo: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** characters */
export interface DbCharacterRow {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  role: string;
  age: string;
  gender: string;
  occupation: string;
  personality: string;
  goal: string;
  secret: string;
  memo: string;
  image: string;
  color: string;
  is_favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** inspirations */
export interface DbInspirationRow {
  id: string;
  project_id: string;
  document_id: string;
  user_id: string;
  selected_text: string;
  work_title: string;
  author: string;
  memo: string;
  start_offset: number;
  end_offset: number;
  created_at: string;
  updated_at: string;
}

/** memos */
export interface DbMemoRow {
  id: string;
  project_id: string;
  user_id: string;
  body: string;
  kind: string;
  is_pinned: boolean;
  is_resolved: boolean;
  document_id: string | null;
  character_id: string | null;
  foreshadowing_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** word_treasury */
export interface DbWordTreasuryRow {
  id: string;
  project_id: string;
  user_id: string;
  word: string;
  meaning: string;
  example: string;
  note: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** foreshadowings */
export interface DbForeshadowingRow {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  planted_document_id: string | null;
  payoff_document_id: string | null;
  related_character_ids: string[];
  importance: number;
  created_at: string;
  updated_at: string;
}

/** scene_metas 행 타입 — DB 테이블명은 `scenes` */
export type DbSceneMetaRow = {
  id: string;
  user_id: string;
  project_id: string;
  document_id: string;
  scene_number: number;
  status: string;
  memo: string;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
};

/** manuscript_versions — 명시적 스냅샷 (자동 저장과 별개) */
export interface DbManuscriptVersionRow {
  id: string;
  project_id: string;
  document_id: string;
  manuscript_id: string;
  user_id: string;
  version_number: number;
  name: string;
  content: string;
  plain_text: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

/** timeline_events — 사건 시간순 정리 */
export interface DbTimelineEventRow {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  sort_order: number;
  document_id: string | null;
  scene_stable_id: string | null;
  character_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 테이블 이름 — SQL / 리포지토리에서 동일하게 사용 */
export const DB_TABLES = {
  projects: "projects",
  documents: "documents",
  manuscripts: "manuscripts",
  manuscript_versions: "manuscript_versions",
  /** Writing Vault (구 dialogues) */
  dialogues: "writing_vault",
  characters: "characters",
  inspirations: "inspirations",
  memos: "memos",
  word_treasury: "word_treasury",
  foreshadowings: "foreshadowings",
  /** Scene 메타 (구 scene_metas) */
  scene_metas: "scenes",
  timeline_events: "timeline_events",
} as const;
