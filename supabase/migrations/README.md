# Supabase Migrations

Novel Studio 데이터베이스 스키마는 이 폴더의 SQL로 관리합니다.

## 한 번에 맞추기 (권장)

init만 적용한 DB에서 Timeline/작품생성/휴지통 등이 깨질 때:

1. Supabase → **SQL Editor** → **New query**
2. `supabase/HOTFIX_schema_ensure.sql` **전체** 실행
3. 앱 새로고침

## 개별 HOTFIX

| 증상 | 파일 |
|------|------|
| `timeline_events` 없음 (PGRST205) | `../HOTFIX_timeline_events.sql` |
| `projects.type` 없음 (PGRST204) | `../HOTFIX_projects_type.sql` |
| 위 전부 + versions/trash/section links | `../HOTFIX_schema_ensure.sql` |

## 적용 방법 (초보자)

자세한 단계는 프로젝트 루트 `README.md` 의  
**「Supabase Migration 적용 방법」** 을 따라 주세요.

CLI(`supabase db push`)를 쓰는 경우에도 같은 파일이 적용됩니다.
