-- =============================================================================
-- characters — 프로필 선택 컬럼 보장 (미적용 DB에서 upsert 실패 방지)
-- =============================================================================
-- nickname / status / intro 가 없으면 PostgREST upsert 가 거부될 수 있다.
-- (앱은 값이 있을 때만 해당 키를 보내고, 실패 시 기본 컬럼으로 재시도함)
-- =============================================================================

alter table public.characters
  add column if not exists nickname text not null default '';

alter table public.characters
  add column if not exists status text not null default '';

alter table public.characters
  add column if not exists intro text not null default '';

comment on column public.characters.nickname is
  'Display nickname for @mention autocomplete';

comment on column public.characters.status is
  'Current story status (traveling / missing / injured, etc.)';

comment on column public.characters.intro is
  'One-line character intro for cards and autocomplete';
