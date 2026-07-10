-- =============================================================================
-- Novel Studio — inspirations 테이블 (영감 노트)
-- =============================================================================

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

alter table public.inspirations enable row level security;

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
