-- =============================================================================
-- trash_items — Soft Delete 공통 휴지통
-- =============================================================================
-- 엔티티 스냅샷을 payload 로 보관. 복원 시 live 테이블로 되돌린다.
-- expires_at 은 30일 후 자동 영구삭제 구조용 (실행은 앱/크론 별도).
-- =============================================================================

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
create policy trash_items_select_own
  on public.trash_items for select
  using (auth.uid() = user_id);

drop policy if exists trash_items_insert_own on public.trash_items;
create policy trash_items_insert_own
  on public.trash_items for insert
  with check (auth.uid() = user_id);

drop policy if exists trash_items_update_own on public.trash_items;
create policy trash_items_update_own
  on public.trash_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists trash_items_delete_own on public.trash_items;
create policy trash_items_delete_own
  on public.trash_items for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.trash_items to authenticated;

-- Soft-hide projects without cascading child deletes (trash softDelete path)
alter table public.projects add column if not exists deleted_at timestamptz;

create index if not exists projects_user_deleted_at_idx
  on public.projects (user_id, deleted_at);
