-- =============================================================================
-- projects.type / deleted_at 보장 (미적용 DB에서 작품 생성 실패 방지)
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

alter table public.projects
  add column if not exists deleted_at timestamptz;

create index if not exists projects_user_deleted_at_idx
  on public.projects (user_id, deleted_at);

notify pgrst, 'reload schema';
