-- =============================================================================
-- Novel Studio — Initial Database Migration
-- =============================================================================
-- 파일: supabase/migrations/20260711000000_init_novel_studio.sql
--
-- [초보자용] 이 파일 전체를 Supabase SQL Editor에 붙여 넣고 Run 하세요.
-- Table Editor가 비어 있는 새 프로젝트에 그대로 사용하면 됩니다.
-- 같은 SQL을 다시 실행해도 안전합니다 (if not exists / drop policy if exists).
--
-- 생성 테이블
--   1. projects          — 작품
--   2. documents         — Document(목차) ※ Manuscript가 참조하므로 필수
--   3. manuscripts       — 원고 본문
--   4. scenes            — Scene 상태·메모·접힘 (원고와 분리, export 제외)
--   5. characters        — 인물
--   6. memos             — 메모
--   7. writing_vault     — Writing Vault (대사·문장 금고)
--   8. inspirations      — 영감 노트
--   9. foreshadowings    — 복선
--  10. word_treasury     — 어휘 금고 ※ 앱 저장 계층용
--
-- 공통 규칙
--   - Primary Key: uuid
--   - user_id: auth.users 참조 (본인 데이터만)
--   - created_at / updated_at: timestamptz
--   - project_id: projects 참조 (해당 시)
--   - RLS: 모든 테이블 활성화 + 본인만 CRUD
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1) projects — 작품
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  premise text,
  status text not null default 'ideation',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx
  on public.projects (user_id);
create index if not exists projects_user_sort_idx
  on public.projects (user_id, sort_order);


-- ---------------------------------------------------------------------------
-- 2) documents — Document / Chapters 목차
--    Manuscript · Inspiration · Scene 이 document_id 로 연결됩니다.
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'novel',
  sort_order integer not null default 0,
  status text not null default 'planned',
  summary text,
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx
  on public.documents (user_id);
create index if not exists documents_project_id_idx
  on public.documents (project_id);
create index if not exists documents_project_sort_idx
  on public.documents (project_id, sort_order);


-- ---------------------------------------------------------------------------
-- 3) manuscripts — 원고 본문 (Document당 1개)
-- ---------------------------------------------------------------------------
create table if not exists public.manuscripts (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  plain_text text not null default '',
  word_count integer not null default 0,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id)
);

create index if not exists manuscripts_user_id_idx
  on public.manuscripts (user_id);
create index if not exists manuscripts_project_id_idx
  on public.manuscripts (project_id);
create index if not exists manuscripts_document_id_idx
  on public.manuscripts (document_id);


-- ---------------------------------------------------------------------------
-- 4) scenes — Scene 메타 (상태·메모·접힘)
--    원고 본문의 #1 #2 … 구분자와 scene_number 로 매칭합니다.
--    메모는 export(txt/pdf)에 포함되지 않습니다.
-- ---------------------------------------------------------------------------
create table if not exists public.scenes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  scene_number integer not null,
  -- draft | editing | done
  status text not null default 'draft',
  memo text not null default '',
  is_collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, scene_number, user_id)
);

create index if not exists scenes_user_id_idx
  on public.scenes (user_id);
create index if not exists scenes_project_id_idx
  on public.scenes (project_id);
create index if not exists scenes_document_id_idx
  on public.scenes (document_id);


-- ---------------------------------------------------------------------------
-- 5) characters — 인물 프로필
-- ---------------------------------------------------------------------------
create table if not exists public.characters (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  role text not null default '',
  age text not null default '',
  gender text not null default '',
  occupation text not null default '',
  personality text not null default '',
  goal text not null default '',
  secret text not null default '',
  memo text not null default '',
  image text not null default '',
  color text not null default '#2563eb',
  is_favorite boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_id_idx
  on public.characters (user_id);
create index if not exists characters_project_id_idx
  on public.characters (project_id);


-- ---------------------------------------------------------------------------
-- 6) foreshadowings — 복선 (memos 가 참조할 수 있어 memos 보다 먼저 생성)
-- ---------------------------------------------------------------------------
create table if not exists public.foreshadowings (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description text,
  status text not null default 'planned',
  planted_document_id uuid references public.documents (id) on delete set null,
  payoff_document_id uuid references public.documents (id) on delete set null,
  related_character_ids uuid[] not null default '{}',
  importance integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists foreshadowings_user_id_idx
  on public.foreshadowings (user_id);
create index if not exists foreshadowings_project_id_idx
  on public.foreshadowings (project_id);


-- ---------------------------------------------------------------------------
-- 7) memos — 메모
-- ---------------------------------------------------------------------------
create table if not exists public.memos (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  kind text not null default 'note',
  is_pinned boolean not null default false,
  is_resolved boolean not null default false,
  document_id uuid references public.documents (id) on delete set null,
  character_id uuid references public.characters (id) on delete set null,
  foreshadowing_id uuid references public.foreshadowings (id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memos_user_id_idx
  on public.memos (user_id);
create index if not exists memos_project_id_idx
  on public.memos (project_id);


-- ---------------------------------------------------------------------------
-- 8) writing_vault — Writing Vault (대사·문장 금고)
-- ---------------------------------------------------------------------------
create table if not exists public.writing_vault (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- sentence | word | idea
  entry_type text not null default 'sentence',
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  reference_work_title text not null default '',
  reference_author text not null default '',
  reference_memo text not null default '',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists writing_vault_user_id_idx
  on public.writing_vault (user_id);
create index if not exists writing_vault_project_id_idx
  on public.writing_vault (project_id);


-- ---------------------------------------------------------------------------
-- 9) inspirations — 영감 노트
-- ---------------------------------------------------------------------------
create table if not exists public.inspirations (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  selected_text text not null default '',
  work_title text not null default '',
  author text not null default '',
  memo text not null default '',
  start_offset integer not null default 0,
  end_offset integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inspirations_user_id_idx
  on public.inspirations (user_id);
create index if not exists inspirations_project_id_idx
  on public.inspirations (project_id);
create index if not exists inspirations_document_id_idx
  on public.inspirations (document_id);


-- ---------------------------------------------------------------------------
-- 10) word_treasury — 어휘 금고
-- ---------------------------------------------------------------------------
create table if not exists public.word_treasury (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null default '',
  meaning text not null default '',
  example text not null default '',
  note text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_treasury_user_id_idx
  on public.word_treasury (user_id);
create index if not exists word_treasury_project_id_idx
  on public.word_treasury (project_id);


-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
-- auth.uid() = 지금 로그인한 사용자 ID
-- user_id 와 같을 때만 SELECT / INSERT / UPDATE / DELETE 가능
-- =============================================================================

alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.manuscripts enable row level security;
alter table public.scenes enable row level security;
alter table public.characters enable row level security;
alter table public.memos enable row level security;
alter table public.writing_vault enable row level security;
alter table public.inspirations enable row level security;
alter table public.foreshadowings enable row level security;
alter table public.word_treasury enable row level security;


-- ---- projects ----
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own"
  on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own"
  on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own"
  on public.projects for delete using (auth.uid() = user_id);


-- ---- documents ----
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own"
  on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own"
  on public.documents for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete_own"
  on public.documents for delete using (auth.uid() = user_id);


-- ---- manuscripts ----
drop policy if exists "manuscripts_select_own" on public.manuscripts;
drop policy if exists "manuscripts_insert_own" on public.manuscripts;
drop policy if exists "manuscripts_update_own" on public.manuscripts;
drop policy if exists "manuscripts_delete_own" on public.manuscripts;

create policy "manuscripts_select_own"
  on public.manuscripts for select using (auth.uid() = user_id);
create policy "manuscripts_insert_own"
  on public.manuscripts for insert with check (auth.uid() = user_id);
create policy "manuscripts_update_own"
  on public.manuscripts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manuscripts_delete_own"
  on public.manuscripts for delete using (auth.uid() = user_id);


-- ---- scenes ----
drop policy if exists "scenes_select_own" on public.scenes;
drop policy if exists "scenes_insert_own" on public.scenes;
drop policy if exists "scenes_update_own" on public.scenes;
drop policy if exists "scenes_delete_own" on public.scenes;

create policy "scenes_select_own"
  on public.scenes for select using (auth.uid() = user_id);
create policy "scenes_insert_own"
  on public.scenes for insert with check (auth.uid() = user_id);
create policy "scenes_update_own"
  on public.scenes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scenes_delete_own"
  on public.scenes for delete using (auth.uid() = user_id);


-- ---- characters ----
drop policy if exists "characters_select_own" on public.characters;
drop policy if exists "characters_insert_own" on public.characters;
drop policy if exists "characters_update_own" on public.characters;
drop policy if exists "characters_delete_own" on public.characters;

create policy "characters_select_own"
  on public.characters for select using (auth.uid() = user_id);
create policy "characters_insert_own"
  on public.characters for insert with check (auth.uid() = user_id);
create policy "characters_update_own"
  on public.characters for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "characters_delete_own"
  on public.characters for delete using (auth.uid() = user_id);


-- ---- memos ----
drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;

create policy "memos_select_own"
  on public.memos for select using (auth.uid() = user_id);
create policy "memos_insert_own"
  on public.memos for insert with check (auth.uid() = user_id);
create policy "memos_update_own"
  on public.memos for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memos_delete_own"
  on public.memos for delete using (auth.uid() = user_id);


-- ---- writing_vault ----
drop policy if exists "writing_vault_select_own" on public.writing_vault;
drop policy if exists "writing_vault_insert_own" on public.writing_vault;
drop policy if exists "writing_vault_update_own" on public.writing_vault;
drop policy if exists "writing_vault_delete_own" on public.writing_vault;

create policy "writing_vault_select_own"
  on public.writing_vault for select using (auth.uid() = user_id);
create policy "writing_vault_insert_own"
  on public.writing_vault for insert with check (auth.uid() = user_id);
create policy "writing_vault_update_own"
  on public.writing_vault for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "writing_vault_delete_own"
  on public.writing_vault for delete using (auth.uid() = user_id);


-- ---- inspirations ----
drop policy if exists "inspirations_select_own" on public.inspirations;
drop policy if exists "inspirations_insert_own" on public.inspirations;
drop policy if exists "inspirations_update_own" on public.inspirations;
drop policy if exists "inspirations_delete_own" on public.inspirations;

create policy "inspirations_select_own"
  on public.inspirations for select using (auth.uid() = user_id);
create policy "inspirations_insert_own"
  on public.inspirations for insert with check (auth.uid() = user_id);
create policy "inspirations_update_own"
  on public.inspirations for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inspirations_delete_own"
  on public.inspirations for delete using (auth.uid() = user_id);


-- ---- foreshadowings ----
drop policy if exists "foreshadowings_select_own" on public.foreshadowings;
drop policy if exists "foreshadowings_insert_own" on public.foreshadowings;
drop policy if exists "foreshadowings_update_own" on public.foreshadowings;
drop policy if exists "foreshadowings_delete_own" on public.foreshadowings;

create policy "foreshadowings_select_own"
  on public.foreshadowings for select using (auth.uid() = user_id);
create policy "foreshadowings_insert_own"
  on public.foreshadowings for insert with check (auth.uid() = user_id);
create policy "foreshadowings_update_own"
  on public.foreshadowings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "foreshadowings_delete_own"
  on public.foreshadowings for delete using (auth.uid() = user_id);


-- ---- word_treasury ----
drop policy if exists "word_treasury_select_own" on public.word_treasury;
drop policy if exists "word_treasury_insert_own" on public.word_treasury;
drop policy if exists "word_treasury_update_own" on public.word_treasury;
drop policy if exists "word_treasury_delete_own" on public.word_treasury;

create policy "word_treasury_select_own"
  on public.word_treasury for select using (auth.uid() = user_id);
create policy "word_treasury_insert_own"
  on public.word_treasury for insert with check (auth.uid() = user_id);
create policy "word_treasury_update_own"
  on public.word_treasury for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "word_treasury_delete_own"
  on public.word_treasury for delete using (auth.uid() = user_id);


-- =============================================================================
-- Privileges — anon / authenticated 가 테이블에 접근할 수 있게 함
-- (없으면 앱에서 "permission denied" / 클라우드 저장 실패)
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.projects to anon, authenticated, service_role;
grant select, insert, update, delete on table public.documents to anon, authenticated, service_role;
grant select, insert, update, delete on table public.manuscripts to anon, authenticated, service_role;
grant select, insert, update, delete on table public.scenes to anon, authenticated, service_role;
grant select, insert, update, delete on table public.characters to anon, authenticated, service_role;
grant select, insert, update, delete on table public.memos to anon, authenticated, service_role;
grant select, insert, update, delete on table public.writing_vault to anon, authenticated, service_role;
grant select, insert, update, delete on table public.inspirations to anon, authenticated, service_role;
grant select, insert, update, delete on table public.foreshadowings to anon, authenticated, service_role;
grant select, insert, update, delete on table public.word_treasury to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;


-- =============================================================================
-- 끝.
-- Table Editor 에서 위 테이블들이 보이면 성공입니다.
-- =============================================================================
