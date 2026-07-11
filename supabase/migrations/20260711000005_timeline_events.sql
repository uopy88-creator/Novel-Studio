-- =============================================================================
-- timeline_events — 사건 시간순 정리 (연표 아님)
-- =============================================================================
-- 제목 · 설명 · 관련 Scene · 관련 Character · sort_order
-- =============================================================================

create table if not exists public.timeline_events (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  document_id uuid references public.documents (id) on delete set null,
  -- Scene 안정 ID (예: scene_001). Scene 은 별도 테이블이 아님.
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
