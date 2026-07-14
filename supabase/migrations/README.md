# Supabase Migrations

Novel Studio 데이터베이스 스키마는 이 폴더의 SQL로 관리합니다.

## 현재 Migration

| 파일 | 설명 |
|------|------|
| `20260711000000_init_novel_studio.sql` | **최초 설치용** — 전체 테이블 + RLS + 권한 |
| `20260711000001_grant_table_privileges.sql` | 이미 테이블만 만든 경우 — **권한(GRANT) 추가** |
| `20260711000002_writing_vault_expand.sql` | Writing Vault 확장 컬럼 (type/title/reference) |
| `20260711000005_timeline_events.sql` | **Timeline 사건 테이블** (init 에 없음 — 별도 실행 필요) |
| `20260714000006_characters_ensure_profile_fields.sql` | Characters nickname/status/intro 컬럼 보장 |
| `20260714000007_timeline_events_ensure.sql` | Timeline 테이블 보장 (미적용 DB용) |

## Timeline 오류 (PGRST205)

화면에 `Could not find the table 'public.timeline_events'` 가 보이면:

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. `supabase/HOTFIX_timeline_events.sql` **전체** 복사 → 붙여넣기 → **Run**
3. Table Editor 에서 `timeline_events` 확인 후 앱 새로고침

## 적용 방법 (초보자)

자세한 단계는 프로젝트 루트 `README.md` 의  
**「Supabase Migration 적용 방법」** 을 따라 주세요.

요약:

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. `20260711000000_init_novel_studio.sql` **전체** 복사 → 붙여넣기
3. **Run**
4. **Table Editor** 에서 테이블이 보이는지 확인
5. Timeline 을 쓰려면 `20260711000005_timeline_events.sql` (또는 HOTFIX) 도 실행

CLI(`supabase db push`)를 쓰는 경우에도 같은 파일이 적용됩니다.
