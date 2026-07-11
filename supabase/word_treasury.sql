-- word_treasury (Word Vault / 어휘 금고) 테이블만 추가

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

alter table public.word_treasury enable row level security;

drop policy if exists "word_treasury_select_own" on public.word_treasury;
drop policy if exists "word_treasury_insert_own" on public.word_treasury;
drop policy if exists "word_treasury_update_own" on public.word_treasury;
drop policy if exists "word_treasury_delete_own" on public.word_treasury;

create policy "word_treasury_select_own" on public.word_treasury for select using (auth.uid() = user_id);
create policy "word_treasury_insert_own" on public.word_treasury for insert with check (auth.uid() = user_id);
create policy "word_treasury_update_own" on public.word_treasury for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "word_treasury_delete_own" on public.word_treasury for delete using (auth.uid() = user_id);
