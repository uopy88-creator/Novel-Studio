-- =============================================================================
-- Novel Studio — Table privileges for anon / authenticated
-- =============================================================================
-- 파일: supabase/migrations/20260711000001_grant_table_privileges.sql
--
-- [초보자용]
-- 1. Supabase → SQL Editor → New query
-- 2. 이 파일 내용 전체 복사 → 붙여넣기 (경로 이름 말고 내용!)
-- 3. Run → Success
--
-- 증상: 앱에서 "클라우드 저장에 실패했습니다"
-- 원인: 테이블은 생겼지만 로그인 사용자(authenticated)에게 권한이 없음
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.projects to anon, authenticated, service_role;
grant select, insert, update, delete on table public.documents to anon, authenticated, service_role;
grant select, insert, update, delete on table public.manuscripts to anon, authenticated, service_role;
grant select, insert, update, delete on table public.scenes to anon, authenticated, service_role;
grant select, insert, update, delete on table public.characters to anon, authenticated, service_role;
grant select, insert, update, delete on table public.memos to anon, authenticated, service_role;
grant select, insert, update, delete on table public.writing_vault to anon, authenticated, service_role;
grant select, insert, update, delete on table public.inspirations to anon, authenticated, service_role;
grant select, insert, update, delete on table public.foreshadowings to anon, authenticated, service_role;
grant select, insert, update, delete on table public.word_treasury to anon, authenticated, service_role;

-- 앞으로 만드는 테이블에도 기본 권한 부여
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
