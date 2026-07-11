# Supabase Migrations

Novel Studio 데이터베이스 스키마는 이 폴더의 SQL로 관리합니다.

## 현재 Migration

| 파일 | 설명 |
|------|------|
| `20260711000000_init_novel_studio.sql` | **최초 설치용** — 전체 테이블 + RLS + 권한 |
| `20260711000001_grant_table_privileges.sql` | 이미 테이블만 만든 경우 — **권한(GRANT) 추가** |
| `20260711000002_writing_vault_expand.sql` | Writing Vault 확장 컬럼 (type/title/reference) |

## 적용 방법 (초보자)

자세한 단계는 프로젝트 루트 `README.md` 의  
**「Supabase Migration 적용 방법」** 을 따라 주세요.

요약:

1. Supabase 대시보드 → **SQL Editor** → **New query**
2. `20260711000000_init_novel_studio.sql` **전체** 복사 → 붙여넣기
3. **Run**
4. **Table Editor** 에서 테이블이 보이는지 확인

CLI(`supabase db push`)를 쓰는 경우에도 같은 파일이 적용됩니다.
