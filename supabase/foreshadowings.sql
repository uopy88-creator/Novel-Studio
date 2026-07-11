-- foreshadowings 테이블만 추가

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

alter table public.foreshadowings enable row level security;

drop policy if exists "foreshadowings_select_own" on public.foreshadowings;
drop policy if exists "foreshadowings_insert_own" on public.foreshadowings;
drop policy if exists "foreshadowings_update_own" on public.foreshadowings;
drop policy if exists "foreshadowings_delete_own" on public.foreshadowings;

create policy "foreshadowings_select_own" on public.foreshadowings for select using (auth.uid() = user_id);
create policy "foreshadowings_insert_own" on public.foreshadowings for insert with check (auth.uid() = user_id);
create policy "foreshadowings_update_own" on public.foreshadowings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "foreshadowings_delete_own" on public.foreshadowings for delete using (auth.uid() = user_id);
