-- memos 테이블만 추가 (이미 schema 를 예전에 실행한 경우)
-- 전체는 migration_full_cloud.sql 을 권장합니다.

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

alter table public.memos enable row level security;

drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;

create policy "memos_select_own" on public.memos for select using (auth.uid() = user_id);
create policy "memos_insert_own" on public.memos for insert with check (auth.uid() = user_id);
create policy "memos_update_own" on public.memos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memos_delete_own" on public.memos for delete using (auth.uid() = user_id);
