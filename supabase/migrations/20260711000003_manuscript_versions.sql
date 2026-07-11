-- =============================================================================
-- Novel Studio — Manuscript Versions (명시적 스냅샷)
-- =============================================================================
-- 파일: supabase/migrations/20260711000003_manuscript_versions.sql
--
-- [초보자용]
-- 1. Supabase → SQL Editor → New query
-- 2. 이 파일 내용 전체 복사 → 붙여넣기 (경로 이름 말고 내용!)
-- 3. Run → Success
--
-- 자동 저장(manuscripts)과 별개로, 사용자가 "현재 버전 저장" 할 때만 쌓입니다.
-- =============================================================================

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

create policy "manuscript_versions_select_own"
  on public.manuscript_versions for select using (auth.uid() = user_id);
create policy "manuscript_versions_insert_own"
  on public.manuscript_versions for insert with check (auth.uid() = user_id);
create policy "manuscript_versions_update_own"
  on public.manuscript_versions for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "manuscript_versions_delete_own"
  on public.manuscript_versions for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.manuscript_versions
  to anon, authenticated, service_role;
