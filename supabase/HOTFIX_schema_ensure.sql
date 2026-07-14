-- =============================================================================
-- Schema ensure — init-only DB 를 현재 앱과 호환되게 보장
-- =============================================================================
-- 적용: Supabase SQL Editor 에 이 파일 전체 붙여넣기 → Run
-- =============================================================================

-- projects
alter table public.projects
  add column if not exists type text not null default 'novel';
alter table public.projects
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_type_check'
  ) then
    alter table public.projects
      add constraint projects_type_check
      check (type in ('novel', 'poem', 'essay', 'other'));
  end if;
end $$;

create index if not exists projects_user_deleted_at_idx
  on public.projects (user_id, deleted_at);

-- characters profile
alter table public.characters add column if not exists nickname text not null default '';
alter table public.characters add column if not exists status text not null default '';
alter table public.characters add column if not exists intro text not null default '';

-- memos optional
alter table public.memos add column if not exists section_stable_id text;
alter table public.memos add column if not exists source_text text;

-- inspirations / foreshadowings section links
alter table public.inspirations add column if not exists section_stable_id text;
alter table public.foreshadowings add column if not exists planted_section_stable_id text;
alter table public.foreshadowings add column if not exists payoff_section_stable_id text;

-- timeline_events
create table if not exists public.timeline_events (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  document_id uuid references public.documents (id) on delete set null,
  scene_stable_id text,
  character_id uuid references public.characters (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timeline_events_user_id_idx on public.timeline_events (user_id);
create index if not exists timeline_events_project_id_idx on public.timeline_events (project_id);
create index if not exists timeline_events_project_sort_idx on public.timeline_events (project_id, sort_order);

alter table public.timeline_events enable row level security;
drop policy if exists "timeline_events_select_own" on public.timeline_events;
drop policy if exists "timeline_events_insert_own" on public.timeline_events;
drop policy if exists "timeline_events_update_own" on public.timeline_events;
drop policy if exists "timeline_events_delete_own" on public.timeline_events;
create policy "timeline_events_select_own" on public.timeline_events for select using (auth.uid() = user_id);
create policy "timeline_events_insert_own" on public.timeline_events for insert with check (auth.uid() = user_id);
create policy "timeline_events_update_own" on public.timeline_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "timeline_events_delete_own" on public.timeline_events for delete using (auth.uid() = user_id);
grant select, insert, update, delete on table public.timeline_events to anon, authenticated, service_role;

-- manuscript_versions
create table if not exists public.manuscript_versions (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  manuscript_id uuid not null references public.manuscripts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  name text not null default '',
  content text not null default '',
  plain_text text not null default '',
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists manuscript_versions_document_created_idx
  on public.manuscript_versions (document_id, created_at desc);
create index if not exists manuscript_versions_user_idx
  on public.manuscript_versions (user_id);

alter table public.manuscript_versions enable row level security;
drop policy if exists "manuscript_versions_select_own" on public.manuscript_versions;
drop policy if exists "manuscript_versions_insert_own" on public.manuscript_versions;
drop policy if exists "manuscript_versions_update_own" on public.manuscript_versions;
drop policy if exists "manuscript_versions_delete_own" on public.manuscript_versions;
create policy "manuscript_versions_select_own" on public.manuscript_versions for select using (auth.uid() = user_id);
create policy "manuscript_versions_insert_own" on public.manuscript_versions for insert with check (auth.uid() = user_id);
create policy "manuscript_versions_update_own" on public.manuscript_versions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manuscript_versions_delete_own" on public.manuscript_versions for delete using (auth.uid() = user_id);
grant select, insert, update, delete on table public.manuscript_versions to anon, authenticated, service_role;

-- trash_items
create table if not exists public.trash_items (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  entity_type text not null,
  entity_id text not null,
  name text not null default '',
  deleted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists trash_items_user_project_idx
  on public.trash_items (user_id, project_id, deleted_at desc);
create index if not exists trash_items_expires_idx
  on public.trash_items (expires_at);

alter table public.trash_items enable row level security;
drop policy if exists trash_items_select_own on public.trash_items;
create policy trash_items_select_own on public.trash_items for select using (auth.uid() = user_id);
drop policy if exists trash_items_insert_own on public.trash_items;
create policy trash_items_insert_own on public.trash_items for insert with check (auth.uid() = user_id);
drop policy if exists trash_items_update_own on public.trash_items;
create policy trash_items_update_own on public.trash_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists trash_items_delete_own on public.trash_items;
create policy trash_items_delete_own on public.trash_items for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.trash_items to anon, authenticated, service_role;

notify pgrst, 'reload schema';
