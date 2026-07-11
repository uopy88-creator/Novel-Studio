-- =============================================================================
-- [구버전 참고] 새 프로젝트는 아래 Migration 을 사용하세요.
--
--   supabase/migrations/20260711000000_init_novel_studio.sql
--
-- =============================================================================
-- Novel Studio — Supabase Database Schema + RLS (legacy snapshot)
-- -----------------------------------------------------------------------------
-- Supabase Dashboard → SQL Editor 에 붙여 넣고 Run 하세요.
-- 로그인(Auth)이 켜져 있어야 auth.uid() 가 동작합니다.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tables
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

-- ---------------------------------------------------------------------------
-- 2) Indexes
-- ---------------------------------------------------------------------------

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_user_sort_idx on public.projects (user_id, sort_order);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_project_id_idx on public.documents (project_id);
create index if not exists documents_project_sort_idx on public.documents (project_id, sort_order);

create index if not exists manuscripts_user_id_idx on public.manuscripts (user_id);
create index if not exists manuscripts_project_id_idx on public.manuscripts (project_id);
create index if not exists manuscripts_document_id_idx on public.manuscripts (document_id);

create index if not exists dialogues_user_id_idx on public.dialogues (user_id);
create index if not exists dialogues_project_id_idx on public.dialogues (project_id);

create table if not exists public.characters (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  content text not null default '',
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
-- 3) Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.manuscripts enable row level security;
alter table public.dialogues enable row level security;
alter table public.characters enable row level security;
alter table public.inspirations enable row level security;

-- 기존 정책이 있으면 재실행을 위해 drop 후 create
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = user_id);

drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "documents_insert_own"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "documents_update_own"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "documents_delete_own"
  on public.documents for delete
  using (auth.uid() = user_id);

drop policy if exists "manuscripts_select_own" on public.manuscripts;
drop policy if exists "manuscripts_insert_own" on public.manuscripts;
drop policy if exists "manuscripts_update_own" on public.manuscripts;
drop policy if exists "manuscripts_delete_own" on public.manuscripts;

create policy "manuscripts_select_own"
  on public.manuscripts for select
  using (auth.uid() = user_id);

create policy "manuscripts_insert_own"
  on public.manuscripts for insert
  with check (auth.uid() = user_id);

create policy "manuscripts_update_own"
  on public.manuscripts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "manuscripts_delete_own"
  on public.manuscripts for delete
  using (auth.uid() = user_id);

drop policy if exists "dialogues_select_own" on public.dialogues;
drop policy if exists "dialogues_insert_own" on public.dialogues;
drop policy if exists "dialogues_update_own" on public.dialogues;
drop policy if exists "dialogues_delete_own" on public.dialogues;

create policy "dialogues_select_own"
  on public.dialogues for select
  using (auth.uid() = user_id);

create policy "dialogues_insert_own"
  on public.dialogues for insert
  with check (auth.uid() = user_id);

create policy "dialogues_update_own"
  on public.dialogues for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dialogues_delete_own"
  on public.dialogues for delete
  using (auth.uid() = user_id);

drop policy if exists "characters_select_own" on public.characters;
drop policy if exists "characters_insert_own" on public.characters;
drop policy if exists "characters_update_own" on public.characters;
drop policy if exists "characters_delete_own" on public.characters;

create policy "characters_select_own"
  on public.characters for select
  using (auth.uid() = user_id);

create policy "characters_insert_own"
  on public.characters for insert
  with check (auth.uid() = user_id);

create policy "characters_update_own"
  on public.characters for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "characters_delete_own"
  on public.characters for delete
  using (auth.uid() = user_id);

drop policy if exists "inspirations_select_own" on public.inspirations;
drop policy if exists "inspirations_insert_own" on public.inspirations;
drop policy if exists "inspirations_update_own" on public.inspirations;
drop policy if exists "inspirations_delete_own" on public.inspirations;

create policy "inspirations_select_own"
  on public.inspirations for select
  using (auth.uid() = user_id);

create policy "inspirations_insert_own"
  on public.inspirations for insert
  with check (auth.uid() = user_id);

create policy "inspirations_update_own"
  on public.inspirations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "inspirations_delete_own"
  on public.inspirations for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- memos / word_treasury / foreshadowings
-- (전체 주석·초보자 안내는 migration_full_cloud.sql 참고)
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
  foreshadowing_id uuid,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memos_user_id_idx on public.memos (user_id);
create index if not exists memos_project_id_idx on public.memos (project_id);

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

alter table public.memos enable row level security;
alter table public.word_treasury enable row level security;
alter table public.foreshadowings enable row level security;

drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;
create policy "memos_select_own" on public.memos for select using (auth.uid() = user_id);
create policy "memos_insert_own" on public.memos for insert with check (auth.uid() = user_id);
create policy "memos_update_own" on public.memos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memos_delete_own" on public.memos for delete using (auth.uid() = user_id);

drop policy if exists "word_treasury_select_own" on public.word_treasury;
drop policy if exists "word_treasury_insert_own" on public.word_treasury;
drop policy if exists "word_treasury_update_own" on public.word_treasury;
drop policy if exists "word_treasury_delete_own" on public.word_treasury;
create policy "word_treasury_select_own" on public.word_treasury for select using (auth.uid() = user_id);
create policy "word_treasury_insert_own" on public.word_treasury for insert with check (auth.uid() = user_id);
create policy "word_treasury_update_own" on public.word_treasury for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "word_treasury_delete_own" on public.word_treasury for delete using (auth.uid() = user_id);

drop policy if exists "foreshadowings_select_own" on public.foreshadowings;
drop policy if exists "foreshadowings_insert_own" on public.foreshadowings;
drop policy if exists "foreshadowings_update_own" on public.foreshadowings;
drop policy if exists "foreshadowings_delete_own" on public.foreshadowings;
create policy "foreshadowings_select_own" on public.foreshadowings for select using (auth.uid() = user_id);
create policy "foreshadowings_insert_own" on public.foreshadowings for insert with check (auth.uid() = user_id);
create policy "foreshadowings_update_own" on public.foreshadowings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "foreshadowings_delete_own" on public.foreshadowings for delete using (auth.uid() = user_id);

-- scene_metas (Scene 상태·메모 — 원고와 분리)
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

alter table public.scene_metas enable row level security;

drop policy if exists "scene_metas_select_own" on public.scene_metas;
drop policy if exists "scene_metas_insert_own" on public.scene_metas;
drop policy if exists "scene_metas_update_own" on public.scene_metas;
drop policy if exists "scene_metas_delete_own" on public.scene_metas;

create policy "scene_metas_select_own" on public.scene_metas for select using (auth.uid() = user_id);
create policy "scene_metas_insert_own" on public.scene_metas for insert with check (auth.uid() = user_id);
create policy "scene_metas_update_own" on public.scene_metas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scene_metas_delete_own" on public.scene_metas for delete using (auth.uid() = user_id);
