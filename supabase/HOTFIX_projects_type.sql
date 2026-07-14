-- =============================================================================
-- HOTFIX: projects.type 컬럼 추가
-- =============================================================================
-- 증상: Could not find the 'type' column of 'projects' in the schema cache
--       (PostgREST code PGRST204) — 새 작품 추가 실패
--
-- 적용: Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
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

-- soft-hide(휴지통) 도 아직이면 함께 보장
alter table public.projects
  add column if not exists deleted_at timestamptz;

create index if not exists projects_user_deleted_at_idx
  on public.projects (user_id, deleted_at);

notify pgrst, 'reload schema';
