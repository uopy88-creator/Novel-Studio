-- =============================================================================
-- characters.content — 자유 형식 프로필 본문
-- -----------------------------------------------------------------------------
-- 구조화 폼 대신 Manuscript와 동일한 에디터로 프로필을 작성한다.
-- 기존 role/age/… 컬럼은 유지하고, 값이 있으면 content로 한 번 옮긴다.
-- =============================================================================

alter table public.characters
  add column if not exists content text not null default '';

-- 아직 content가 비어 있는 행만 레거시 필드로 채운다
update public.characters
set content = trim(both E'\n' from concat_ws(E'\n',
  '이름 : ' || coalesce(nullif(trim(name), ''), ''),
  '별명 : ' || coalesce(nullif(trim(role), ''), ''),
  '나이 : ' || coalesce(nullif(trim(age), ''), ''),
  case
    when nullif(trim(gender), '') is not null then '성별 : ' || trim(gender)
    else null
  end,
  '직업 : ' || coalesce(nullif(trim(occupation), ''), ''),
  '외형 :',
  '성격 : ' || coalesce(nullif(trim(personality), ''), ''),
  '말버릇 :',
  '목표 : ' || coalesce(nullif(trim(goal), ''), ''),
  '비밀 : ' || coalesce(nullif(trim(secret), ''), ''),
  '현재 상태 :',
  '메모 : ' || coalesce(nullif(trim(memo), ''), '')
))
where coalesce(trim(content), '') = '';
