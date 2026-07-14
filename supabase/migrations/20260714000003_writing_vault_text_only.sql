-- =============================================================================
-- Writing Vault — 텍스트 전용으로 정리
-- -----------------------------------------------------------------------------
-- document_id / section_stable_id / meta / is_pinned 제거
-- idea → inspiration
-- entry_type: sentence | word | memo | foreshadowing | inspiration
-- =============================================================================

-- 1) 레거시 타입 정규화
update public.writing_vault
set entry_type = 'inspiration'
where entry_type = 'idea';

-- 2) 원고 위치·확장 컬럼 제거 (존재할 때만)
alter table public.writing_vault
  drop column if exists document_id;

alter table public.writing_vault
  drop column if exists section_stable_id;

alter table public.writing_vault
  drop column if exists meta;

alter table public.writing_vault
  drop column if exists is_pinned;

-- 3) CHECK 제약 교체
alter table public.writing_vault
  drop constraint if exists writing_vault_entry_type_check;

alter table public.writing_vault
  add constraint writing_vault_entry_type_check
  check (
    entry_type in (
      'sentence',
      'word',
      'memo',
      'foreshadowing',
      'inspiration'
    )
  );
