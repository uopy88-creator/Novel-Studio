-- =============================================================================
-- timeline_events 보장 (미적용 DB에서 PGRST205 방지)
-- =============================================================================
-- init SQL 에는 timeline_events 가 없음.
-- 이 파일은 20260711000005 와 동일하며, 나중에 적용해도 안전하다.
-- =============================================================================

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

create index if not exists timeline_events_user_id_idx
  on public.timeline_events (user_id);
create index if not exists timeline_events_project_id_idx
  on public.timeline_events (project_id);
create index if not exists timeline_events_project_sort_idx
  on public.timeline_events (project_id, sort_order);

alter table public.timeline_events enable row level security;

drop policy if exists "timeline_events_select_own" on public.timeline_events;
drop policy if exists "timeline_events_insert_own" on public.timeline_events;
drop policy if exists "timeline_events_update_own" on public.timeline_events;
drop policy if exists "timeline_events_delete_own" on public.timeline_events;

create policy "timeline_events_select_own"
  on public.timeline_events for select using (auth.uid() = user_id);
create policy "timeline_events_insert_own"
  on public.timeline_events for insert with check (auth.uid() = user_id);
create policy "timeline_events_update_own"
  on public.timeline_events for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "timeline_events_delete_own"
  on public.timeline_events for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.timeline_events
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
