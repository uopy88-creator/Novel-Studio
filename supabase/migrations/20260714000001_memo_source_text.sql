-- Memo: 원고 선택 원문(source_text) — 이후 Section 연결 UI 확장용
alter table public.memos
  add column if not exists source_text text;

comment on column public.memos.source_text is
  'Manuscript selection text when memo was created from Selection Action Menu';
