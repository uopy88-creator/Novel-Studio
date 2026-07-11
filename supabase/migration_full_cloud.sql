-- =============================================================================
-- [구버전] 이 파일 대신 아래 Migration 을 사용하세요.
--
--   supabase/migrations/20260711000000_init_novel_studio.sql
--
-- Table Editor가 비어 있는 새 프로젝트는 migrations 폴더의 SQL만 Run 하면 됩니다.
-- (테이블명: writing_vault, scenes 등 — 이 파일의 dialogues/scene_metas 와 다름)
-- =============================================================================
--
-- [초보자용 실행 방법]
-- 1. https://supabase.com 대시보드에 로그인합니다.
-- 2. 왼쪽 메뉴 → SQL Editor → New query
-- 3. 이 파일 전체를 복사해 붙여 넣습니다.
-- 4. Run 을 누릅니다.
-- 5. Success 가 보이면 완료입니다.
--
-- [이 SQL이 하는 일]
-- - 작품 데이터를 담는 테이블을 만듭니다.
-- - RLS(Row Level Security)로 "내 데이터만" 보이게 합니다.
-- - 같은 SQL을 다시 실행해도 안전합니다 (if not exists / drop policy if exists).
--
-- [테이블 목록]
--   projects, documents, manuscripts, characters, memos,
--   dialogues, inspirations, word_treasury, foreshadowings, scene_metas
--
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

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_user_sort_idx on public.projects (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2) documents — 문서(목차). 앱 코드에서는 Chapter 라고도 부릅니다.
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

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_project_id_idx on public.documents (project_id);
create index if not exists documents_project_sort_idx on public.documents (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3) manuscripts — 원고 본문 (문서 1개당 원고 1개)
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

create index if not exists manuscripts_user_id_idx on public.manuscripts (user_id);
create index if not exists manuscripts_project_id_idx on public.manuscripts (project_id);
create index if not exists manuscripts_document_id_idx on public.manuscripts (document_id);

-- ---------------------------------------------------------------------------
-- 4) characters — 인물 프로필
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

create index if not exists characters_user_id_idx on public.characters (user_id);
create index if not exists characters_project_id_idx on public.characters (project_id);

-- ---------------------------------------------------------------------------
-- 5) memos — 메모
-- ---------------------------------------------------------------------------
create table if not exists public.memos (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  kind text not null default 'note',
  is_pinned boolean not null default false,
  is_resolved boolean not null default false,
  -- 선택 연결 (없으면 null)
  document_id uuid references public.documents (id) on delete set null,
  character_id uuid references public.characters (id) on delete set null,
  foreshadowing_id uuid, -- foreshadowings 테이블과 순환 FK 방지를 위해 제약 없이 보관
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memos_user_id_idx on public.memos (user_id);
create index if not exists memos_project_id_idx on public.memos (project_id);

-- ---------------------------------------------------------------------------
-- 6) dialogues — 대사 금고
-- ---------------------------------------------------------------------------
create table if not exists public.dialogues (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dialogues_user_id_idx on public.dialogues (user_id);
create index if not exists dialogues_project_id_idx on public.dialogues (project_id);

-- ---------------------------------------------------------------------------
-- 7) inspirations — 영감 노트
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

create index if not exists inspirations_user_id_idx on public.inspirations (user_id);
create index if not exists inspirations_project_id_idx on public.inspirations (project_id);
create index if not exists inspirations_document_id_idx on public.inspirations (document_id);

-- ---------------------------------------------------------------------------
-- 8) word_treasury — 어휘 금고 (Word Vault)
--    단어·관용구·말투 샘플을 모아 둡니다.
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

create index if not exists word_treasury_user_id_idx on public.word_treasury (user_id);
create index if not exists word_treasury_project_id_idx on public.word_treasury (project_id);

-- ---------------------------------------------------------------------------
-- 9) foreshadowings — 복선
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

create index if not exists foreshadowings_user_id_idx on public.foreshadowings (user_id);
create index if not exists foreshadowings_project_id_idx on public.foreshadowings (project_id);

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================
-- auth.uid() = 지금 로그인한 사용자 ID
-- user_id 가 같은 행만 SELECT / INSERT / UPDATE / DELETE 가능
-- =============================================================================

alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.manuscripts enable row level security;
alter table public.characters enable row level security;
alter table public.memos enable row level security;
alter table public.dialogues enable row level security;
alter table public.inspirations enable row level security;
alter table public.word_treasury enable row level security;
alter table public.foreshadowings enable row level security;

-- ---- projects ----
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

-- ---- documents ----
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

-- ---- manuscripts ----
drop policy if exists "manuscripts_select_own" on public.manuscripts;
drop policy if exists "manuscripts_insert_own" on public.manuscripts;
drop policy if exists "manuscripts_update_own" on public.manuscripts;
drop policy if exists "manuscripts_delete_own" on public.manuscripts;

create policy "manuscripts_select_own" on public.manuscripts for select using (auth.uid() = user_id);
create policy "manuscripts_insert_own" on public.manuscripts for insert with check (auth.uid() = user_id);
create policy "manuscripts_update_own" on public.manuscripts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manuscripts_delete_own" on public.manuscripts for delete using (auth.uid() = user_id);

-- ---- characters ----
drop policy if exists "characters_select_own" on public.characters;
drop policy if exists "characters_insert_own" on public.characters;
drop policy if exists "characters_update_own" on public.characters;
drop policy if exists "characters_delete_own" on public.characters;

create policy "characters_select_own" on public.characters for select using (auth.uid() = user_id);
create policy "characters_insert_own" on public.characters for insert with check (auth.uid() = user_id);
create policy "characters_update_own" on public.characters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "characters_delete_own" on public.characters for delete using (auth.uid() = user_id);

-- ---- memos ----
drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;

create policy "memos_select_own" on public.memos for select using (auth.uid() = user_id);
create policy "memos_insert_own" on public.memos for insert with check (auth.uid() = user_id);
create policy "memos_update_own" on public.memos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memos_delete_own" on public.memos for delete using (auth.uid() = user_id);

-- ---- dialogues ----
drop policy if exists "dialogues_select_own" on public.dialogues;
drop policy if exists "dialogues_insert_own" on public.dialogues;
drop policy if exists "dialogues_update_own" on public.dialogues;
drop policy if exists "dialogues_delete_own" on public.dialogues;

create policy "dialogues_select_own" on public.dialogues for select using (auth.uid() = user_id);
create policy "dialogues_insert_own" on public.dialogues for insert with check (auth.uid() = user_id);
create policy "dialogues_update_own" on public.dialogues for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dialogues_delete_own" on public.dialogues for delete using (auth.uid() = user_id);

-- ---- inspirations ----
drop policy if exists "inspirations_select_own" on public.inspirations;
drop policy if exists "inspirations_insert_own" on public.inspirations;
drop policy if exists "inspirations_update_own" on public.inspirations;
drop policy if exists "inspirations_delete_own" on public.inspirations;

create policy "inspirations_select_own" on public.inspirations for select using (auth.uid() = user_id);
create policy "inspirations_insert_own" on public.inspirations for insert with check (auth.uid() = user_id);
create policy "inspirations_update_own" on public.inspirations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inspirations_delete_own" on public.inspirations for delete using (auth.uid() = user_id);

-- ---- word_treasury ----
drop policy if exists "word_treasury_select_own" on public.word_treasury;
drop policy if exists "word_treasury_insert_own" on public.word_treasury;
drop policy if exists "word_treasury_update_own" on public.word_treasury;
drop policy if exists "word_treasury_delete_own" on public.word_treasury;

create policy "word_treasury_select_own" on public.word_treasury for select using (auth.uid() = user_id);
create policy "word_treasury_insert_own" on public.word_treasury for insert with check (auth.uid() = user_id);
create policy "word_treasury_update_own" on public.word_treasury for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "word_treasury_delete_own" on public.word_treasury for delete using (auth.uid() = user_id);

-- ---- foreshadowings ----
drop policy if exists "foreshadowings_select_own" on public.foreshadowings;
drop policy if exists "foreshadowings_insert_own" on public.foreshadowings;
drop policy if exists "foreshadowings_update_own" on public.foreshadowings;
drop policy if exists "foreshadowings_delete_own" on public.foreshadowings;

create policy "foreshadowings_select_own" on public.foreshadowings for select using (auth.uid() = user_id);
create policy "foreshadowings_insert_own" on public.foreshadowings for insert with check (auth.uid() = user_id);
create policy "foreshadowings_update_own" on public.foreshadowings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "foreshadowings_delete_own" on public.foreshadowings for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- scene_metas — Scene 상태·메모·접힘 (원고와 분리, export 제외)
-- ---------------------------------------------------------------------------
create table if not exists public.scene_metas (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  scene_number integer not null,
  status text not null default 'draft',
  memo text not null default '',
  is_collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, scene_number, user_id)
);

create index if not exists scene_metas_user_id_idx on public.scene_metas (user_id);
create index if not exists scene_metas_document_id_idx on public.scene_metas (document_id);
create index if not exists scene_metas_project_id_idx on public.scene_metas (project_id);

alter table public.scene_metas enable row level security;

drop policy if exists "scene_metas_select_own" on public.scene_metas;
drop policy if exists "scene_metas_insert_own" on public.scene_metas;
drop policy if exists "scene_metas_update_own" on public.scene_metas;
drop policy if exists "scene_metas_delete_own" on public.scene_metas;

create policy "scene_metas_select_own" on public.scene_metas for select using (auth.uid() = user_id);
create policy "scene_metas_insert_own" on public.scene_metas for insert with check (auth.uid() = user_id);
create policy "scene_metas_update_own" on public.scene_metas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scene_metas_delete_own" on public.scene_metas for delete using (auth.uid() = user_id);

-- =============================================================================
-- 끝. Table Editor 에서 테이블이 보이면 성공입니다.
-- =============================================================================
