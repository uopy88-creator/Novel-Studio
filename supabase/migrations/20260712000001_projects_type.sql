-- =============================================================================
-- projects.type — 작품 종류 (novel / poem / essay / other)
-- =============================================================================
-- 파일: supabase/migrations/20260712000001_projects_type.sql
--
-- [초보자용]
-- 1. Supabase → SQL Editor → New query
-- 2. 이 파일 **내용 전체** 복사 → 붙여넣기 (경로 이름 금지)
-- 3. Run → Success
--
-- 기존 projects 행은 type='novel' 로 채워집니다.
-- =============================================================================

alter table public.projects
  add column if not exists type text not null default 'novel';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_type_check'
  ) then
    alter table public.projects
      add constraint projects_type_check
      check (type in ('novel', 'poem', 'essay', 'other'));
  end if;
end $$;
