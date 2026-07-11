-- =============================================================================
-- Writing Vault 확장 — type / title / reference
-- =============================================================================
-- 파일: supabase/migrations/20260711000002_writing_vault_expand.sql
--
-- [초보자용]
-- 1. Supabase → SQL Editor → New query
-- 2. 이 파일 **내용 전체** 복사 → 붙여넣기 (경로 이름 금지)
-- 3. Run → Success
--
-- 기존 writing_vault 행은 entry_type='sentence' 로 유지됩니다.
-- =============================================================================

alter table public.writing_vault
  add column if not exists entry_type text not null default 'sentence';

alter table public.writing_vault
  add column if not exists title text not null default '';

alter table public.writing_vault
  add column if not exists reference_work_title text not null default '';

alter table public.writing_vault
  add column if not exists reference_author text not null default '';

alter table public.writing_vault
  add column if not exists reference_memo text not null default '';

-- 허용 값 제약 (이미 있으면 경우 무시)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'writing_vault_entry_type_check'
  ) then
    alter table public.writing_vault
      add constraint writing_vault_entry_type_check
      check (entry_type in ('sentence', 'word', 'idea'));
  end if;
end $$;

create index if not exists writing_vault_entry_type_idx
  on public.writing_vault (entry_type);

create index if not exists writing_vault_project_type_idx
  on public.writing_vault (project_id, entry_type);
