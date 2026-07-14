-- =============================================================================
-- HOTFIX: timeline_events 테이블 생성
-- =============================================================================
-- 증상: Could not find the table 'public.timeline_events' in the schema cache
--       (PostgREST code PGRST205)
--
-- 적용: Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
-- 이미 있으면 경우에도 안전합니다 (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =============================================================================

create table if not exists public.timeline_events (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  sort_order integer not null default 0,
  document_id uuid references public.documents (id) on delete set null,
  -- Section 안정 ID (DB 컬럼명은 하위 호환용 scene_stable_id)
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

-- PostgREST 스키마 캐시 갱신 (Supabase에서 보통 수 초 내 반영)
notify pgrst, 'reload schema';
