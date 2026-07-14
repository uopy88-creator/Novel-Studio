-- =============================================================================
-- memos — 선택 컬럼 보장 (미적용 DB에서 Memo upsert 실패 방지)
-- =============================================================================
-- source_text / section_stable_id 가 없으면 PostgREST upsert 가 거부될 수 있다.
-- (앱은 값이 있을 때만 해당 키를 보내도록 수정됨 — 컬럼은 여기로 보장)
-- =============================================================================

alter table public.memos
  add column if not exists section_stable_id text;

alter table public.memos
  add column if not exists source_text text;

comment on column public.memos.section_stable_id is
  'Section Registry stable id (optional link)';

comment on column public.memos.source_text is
  'Manuscript selection text when memo was created from Selection Action';
