-- =============================================================================
-- Section 안정 ID 링크 컬럼 (Timeline 과 동일한 연결 방식)
-- -----------------------------------------------------------------------------
-- 번호가 아니라 section_001 형태 ID 로 연결한다.
-- =============================================================================

alter table public.foreshadowings
  add column if not exists planted_section_stable_id text;

alter table public.foreshadowings
  add column if not exists payoff_section_stable_id text;

alter table public.memos
  add column if not exists section_stable_id text;

alter table public.inspirations
  add column if not exists section_stable_id text;

comment on column public.foreshadowings.planted_section_stable_id is
  'Section stable id (e.g. section_001) where foreshadowing is planted';

comment on column public.foreshadowings.payoff_section_stable_id is
  'Section stable id where foreshadowing is paid off';

comment on column public.memos.section_stable_id is
  'Optional linked Section stable id';

comment on column public.inspirations.section_stable_id is
  'Section stable id containing the selected text (offset-based gutter still used)';
