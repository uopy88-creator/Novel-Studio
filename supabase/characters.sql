-- =============================================================================
-- Novel Studio — characters 테이블만 추가 (이미 schema.sql 을 실행한 경우)
-- =============================================================================

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

alter table public.characters enable row level security;

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
