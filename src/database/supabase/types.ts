/**
 * =============================================================================
 * Database 테이블 타입
 * -----------------------------------------------------------------------------
 * Supabase Postgres 스키마와 1:1.
 *
 * users ← auth.users (Supabase Auth)
 * projects → user_id
 * documents → project_id   (로컬 Chapter)
 * manuscripts → document_id
 * dialogues → project_id
 * =============================================================================
 */

/** projects */
export interface DbProjectRow {
  id: string;
  user_id: string;
  title: string;
  premise: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** documents (로컬 Chapter) */
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

/** dialogues */
export interface DbDialogueRow {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  tags: string[];
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

/** 테이블 이름 — SQL / 리포지토리에서 동일하게 사용 */
export const DB_TABLES = {
  projects: "projects",
  documents: "documents",
  manuscripts: "manuscripts",
  dialogues: "dialogues",
  characters: "characters",
  inspirations: "inspirations",
  memos: "memos",
} as const;
