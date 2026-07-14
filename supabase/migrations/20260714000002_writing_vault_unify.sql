-- =============================================================================
-- Writing Vault 통합 — entry_type 확장 + meta + 레거시 데이터 이전
-- =============================================================================
-- idea → inspiration
-- memos / foreshadowings / inspirations → writing_vault 복사
--
-- 주의: 소스 테이블에 section_stable_id 등이 없을 수 있으므로
--       복사 전에 선택 컬럼을 먼저 보장한다.
-- =============================================================================

-- 0) 소스 테이블 선택 컬럼 보장 (없으면 INSERT 가 실패함)
alter table public.memos
  add column if not exists section_stable_id text;

alter table public.memos
  add column if not exists source_text text;

alter table public.foreshadowings
  add column if not exists planted_section_stable_id text;

alter table public.foreshadowings
  add column if not exists payoff_section_stable_id text;

alter table public.inspirations
  add column if not exists section_stable_id text;

-- 1) writing_vault 공통 컬럼
alter table public.writing_vault
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table public.writing_vault
  add column if not exists section_stable_id text;

alter table public.writing_vault
  add column if not exists document_id uuid;

alter table public.writing_vault
  add column if not exists is_pinned boolean not null default false;

-- 2) idea → inspiration
update public.writing_vault
set entry_type = 'inspiration'
where entry_type = 'idea';

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

-- 4) memos → writing_vault (아직 없는 id 만)
insert into public.writing_vault (
  id,
  project_id,
  user_id,
  entry_type,
  title,
  content,
  tags,
  reference_work_title,
  reference_author,
  reference_memo,
  is_favorite,
  is_pinned,
  section_stable_id,
  document_id,
  meta,
  created_at,
  updated_at
)
select
  m.id,
  m.project_id,
  m.user_id,
  'memo',
  '',
  coalesce(m.body, ''),
  coalesce(m.tags, '{}'),
  '',
  '',
  '',
  false,
  coalesce(m.is_pinned, false),
  m.section_stable_id,
  m.document_id,
  jsonb_build_object(
    'kind', coalesce(m.kind, 'note'),
    'isResolved', coalesce(m.is_resolved, false),
    'sourceText', coalesce(m.source_text, ''),
    'characterId', m.character_id,
    'foreshadowingId', m.foreshadowing_id
  ),
  m.created_at,
  m.updated_at
from public.memos m
where not exists (
  select 1 from public.writing_vault w where w.id = m.id
);

-- 5) foreshadowings → writing_vault
insert into public.writing_vault (
  id,
  project_id,
  user_id,
  entry_type,
  title,
  content,
  tags,
  reference_work_title,
  reference_author,
  reference_memo,
  is_favorite,
  is_pinned,
  section_stable_id,
  document_id,
  meta,
  created_at,
  updated_at
)
select
  f.id,
  f.project_id,
  f.user_id,
  'foreshadowing',
  coalesce(f.title, ''),
  coalesce(f.description, ''),
  '{}',
  '',
  '',
  '',
  false,
  false,
  f.planted_section_stable_id,
  f.planted_document_id,
  jsonb_build_object(
    'status', coalesce(f.status, 'planted'),
    'plantedSectionStableId', f.planted_section_stable_id,
    'payoffSectionStableId', f.payoff_section_stable_id,
    'plantedChapterId', f.planted_document_id,
    'payoffChapterId', f.payoff_document_id,
    'relatedCharacterIds', coalesce(f.related_character_ids, '{}'),
    'importance', coalesce(f.importance, 3)
  ),
  f.created_at,
  f.updated_at
from public.foreshadowings f
where not exists (
  select 1 from public.writing_vault w where w.id = f.id
);

-- 6) inspirations → writing_vault
insert into public.writing_vault (
  id,
  project_id,
  user_id,
  entry_type,
  title,
  content,
  tags,
  reference_work_title,
  reference_author,
  reference_memo,
  is_favorite,
  is_pinned,
  section_stable_id,
  document_id,
  meta,
  created_at,
  updated_at
)
select
  i.id,
  i.project_id,
  i.user_id,
  'inspiration',
  '',
  coalesce(i.selected_text, ''),
  '{}',
  coalesce(i.work_title, ''),
  coalesce(i.author, ''),
  coalesce(i.memo, ''),
  false,
  false,
  i.section_stable_id,
  i.document_id,
  jsonb_build_object(
    'startOffset', coalesce(i.start_offset, 0),
    'endOffset', coalesce(i.end_offset, 0)
  ),
  i.created_at,
  i.updated_at
from public.inspirations i
where not exists (
  select 1 from public.writing_vault w where w.id = i.id
);

create index if not exists writing_vault_meta_gin
  on public.writing_vault using gin (meta);

create index if not exists writing_vault_section_stable_id_idx
  on public.writing_vault (section_stable_id)
  where section_stable_id is not null;
