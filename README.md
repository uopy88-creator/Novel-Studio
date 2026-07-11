# Novel Studio

소설·시·에세이 등 **창작 프로젝트를 관리하는 작업실**입니다.  
AI가 글을 대신 쓰는 프로그램이 아닙니다.

기술 스택: **Next.js 15** · **React 19** · **TypeScript** · **Tailwind CSS** · **Supabase Auth + Database**  
배포 목표: **Vercel** — PC / iPad / iPhone 에서 같은 URL로 접속

---

## 환경변수 (Environment Variables)

앱이 Supabase에 연결되려면 **아래 2개만** 필요합니다.

| 변수 이름 | 필수 | 설명 | 어디서 복사하나요? |
|-----------|------|------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | Project Settings → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 공개(anon) API 키 | Project Settings → **API** → `anon` `public` |

예시 값 형태:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

주의:

- `service_role` 키는 **절대** 넣지 마세요. (서버 전용 비밀 키)
- `NEXT_PUBLIC_` 로 시작하는 값은 브라우저에 노출됩니다. anon 키 + RLS로 보호합니다.
- 로컬: `.env.local` (Git에 올리지 않음)  
- Vercel: 대시보드 **Environment Variables** 에 등록

템플릿 파일: `.env.local.example`

---

## 현재 실행 방법 (로컬)

프로젝트 루트(`novel-studio`)에서 아래 순서대로 실행합니다.

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 파일 만들기

```powershell
# Windows PowerShell
Copy-Item .env.local.example .env.local
```

```bash
# macOS / Linux
cp .env.local.example .env.local
```

`.env.local` 을 열고 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 실제 값으로 바꿉니다.

### 3. Supabase Auth + Database 준비

1. 아래 **「Supabase Auth 설정」**  
2. 아래 **「Supabase Migration 적용 방법」**  
   (`supabase/migrations/20260711000000_init_novel_studio.sql`)

### 4. 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

- 로그인 후 작품·문서·원고·Writing Vault·캐릭터·영감 노트는 **Supabase Database**에 저장됩니다.  
- LocalStorage는 **백업/복원** 전용입니다 (로그인 후 CRUD에 사용하지 않음).

### 5. 품질 확인 (배포 전 권장)

```bash
npm run lint
npm run build
```

`npm run build` 가 오류 없이 끝나면 프로덕션 빌드 준비가 된 것입니다.

---

## 자동 배포 (lint → backup tag → commit → push → Vercel)

기능 개발이 끝난 뒤, **명령 하나**로 품질 검사부터 Git Push까지 진행합니다.  
GitHub가 Vercel에 연결되어 있으면 push 후 **Vercel 자동 배포**가 이어집니다.

### 실행

프로젝트 루트에서:

```bash
npm run deploy
```

PowerShell에서 직접 실행:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy.ps1
```

### 흐름

```
npm run deploy
    ↓
① npm run lint          (실패 시 중단)
    ↓
② npm run build         (실패 시 중단)
    ↓
③ Backup Tag 생성
   예) backup-2026-07-11-2130
   → git tag → git push origin --tags
    ↓
④ git add .
    ↓
⑤ Commit Message 입력
   예) feat(scene): improve navigator
    ↓
⑥ git commit
    ↓
⑦ git push
    ↓
⑧ 완료 메시지
   ✔ Lint / Build / Backup Tag / Commit / Push
   Vercel에서 자동 배포가 시작됩니다.
```

### 실패 처리

lint · build · Backup Tag · commit · push 가 실패하면 **단계와 이유**를 출력하고 즉시 종료합니다.  
이후 단계(커밋·푸시 등)는 실행되지 않습니다.

### 참고

- Windows PowerShell 기준입니다. (`scripts/deploy.ps1`)
- Backup Tag는 **새 커밋 직전 HEAD**를 남겨 롤백 지점으로 씁니다.
- Commit Message를 비우면 커밋하지 않고 중단합니다.
- 스테이징할 변경이 없으면 lint/build/tag만 수행하고 commit/push는 건너뜁니다.
- Vercel 자동 배포는 GitHub ↔ Vercel 연동이 되어 있어야 합니다.

---

## Vercel 배포 방법

PC·iPad·iPhone 어디서나 **같은 주소**로 쓰려면 Vercel에 올립니다.

### 1. GitHub 연결

1. 이 프로젝트를 GitHub 저장소에 push 합니다.  
2. [https://vercel.com](https://vercel.com) 에 가입/로그인합니다.  
3. **Add New… → Project** 에서 GitHub 계정을 연결합니다.

### 2. Import Project

1. Novel Studio 저장소를 선택합니다.  
2. Framework Preset 이 **Next.js** 인지 확인합니다. (보통 자동 감지)  
3. Root Directory 는 비워 둡니다. (저장소 루트가 앱 루트일 때)

### 3. Environment Variables 등록

Deploy 하기 **전에** 환경변수를 넣습니다.

1. Import 화면의 **Environment Variables** (또는 배포 후 Settings → Environment Variables)  
2. 아래 두 개를 추가합니다.

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon 키 전체 | Production, Preview |

로컬 `.env.local` 과 **같은 값**을 넣으면 됩니다.

### 4. Deploy

1. **Deploy** 버튼을 누릅니다.  
2. 빌드 로그에서 `Compiled successfully` / 성공 메시지를 확인합니다.  
3. 실패하면 로그의 환경변수 오타·누락을 먼저 확인합니다.

### 5. 발급된 URL 접속

1. 배포가 끝나면 `https://xxxx.vercel.app` 형태의 URL이 생깁니다.  
2. PC·iPad·iPhone 브라우저에서 같은 URL을 엽니다.  
3. (권장) Supabase에 배포 URL을 등록합니다.  
   - Supabase → **Authentication** → **URL Configuration**  
   - **Site URL**: `https://xxxx.vercel.app`  
   - **Redirect URLs**: `https://xxxx.vercel.app/**` 추가

커스텀 도메인은 Vercel → Project → **Settings → Domains** 에서 연결할 수 있습니다.

---

## 배포 설정 점검 (참고)

| 항목 | 상태 |
|------|------|
| `next.config.ts` | Turbopack 루트 고정. Vercel Next.js 배포에 추가 설정 불필요 |
| `middleware.ts` | **없음** — 인증은 클라이언트 `AuthGate` + Supabase 세션 |
| 환경변수 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 만 필수 |
| 빌드 명령 | `npm run build` (`package.json` 그대로 Vercel이 사용) |

---

## 배포 후 동작 체크리스트

배포 URL에서 아래를 순서대로 확인하세요.

- [ ] 배포 URL이 PC / iPad / iPhone 에서 열린다  
- [ ] `/login` 에서 이메일·비밀번호로 **로그인** 된다  
- [ ] `/signup` 으로 **회원가입** 후 바로 들어온다 (Confirm email 끈 경우)  
- [ ] 작품 목록에서 **새 작품**을 만들 수 있다  
- [ ] 작품을 열어 Dashboard / Documents / Manuscript 메뉴가 보인다  
- [ ] Documents에서 문서를 만들고 Manuscript에서 **본문을 작성**할 수 있다  
- [ ] 원고 입력 후 **자동저장** 표시(저장됨)가 나타난다  
- [ ] 페이지를 새로고침해도 같은 계정으로 원고·작품이 유지된다  
- [ ] (다른 기기) 같은 URL·같은 계정으로 로그인하면 데이터가 보인다  
- [ ] 좁은 화면에서 햄버거 메뉴로 사이드바가 열리고, 제목·본문이 가로로 잘리지 않는다  

문제가 있을 때:

| 증상 | 확인 |
|------|------|
| 로그인 실패 / Supabase 미설정 | Vercel 환경변수 등록 후 **Redeploy** |
| 작품이 저장 안 됨 | `supabase/schema.sql` Run 여부, RLS |
| 로컬에만 남음 | 오프라인이거나 env 미설정 → LocalStorage 폴백 |
| 모바일에서 깨짐 | 강제 새로고침, 가로 모드도 한 번 확인 |

---

## Supabase Auth 설정 (초보자용)

1. [https://supabase.com](https://supabase.com) → 프로젝트 생성  
2. **Authentication** → **Providers** → **Email** 활성화  
3. 개발 중에는 **Confirm email** 끄기 (가입 직후 로그인)  
4. **Project Settings** → **API** 에서 URL / anon key 를 `.env.local`(로컬) 또는 Vercel(배포)에 넣기  
5. 로컬: `npm run dev` 재시작 / 배포: Redeploy  

> `service_role` 키는 프론트엔드·Git에 넣지 마세요.

---

## Supabase Migration 적용 방법

Table Editor가 **비어 있는** 새 Supabase 프로젝트에 Novel Studio DB를  
처음부터 만드는 방법입니다. 초보자도 이 순서만 따라 하면 됩니다.

### 가장 흔한 실수 (지금 난 오류)

```
ERROR: syntax error at or near "supabase"
LINE 1: supabase/migrations/20260711000000_init_novel_studio.sql
```

이 오류는 SQL 파일이 잘못된 게 **아닙니다**.

- ❌ SQL Editor에 **파일 경로**(`supabase/migrations/...sql`)를 붙여 넣음  
- ✅ SQL Editor에는 **파일 안의 내용**(SQL 문장)을 붙여 넣어야 함  

붙여 넣은 첫 줄이 아래처럼 **주석으로 시작**해야 합니다.

```sql
-- =============================================================================
-- Novel Studio — Initial Database Migration
```

`supabase/migrations/...` 같은 **경로만** 보이면 잘못된 붙여넣기입니다. 지우고 다시 하세요.

### 테이블은 있는데 앱에서 "클라우드 저장에 실패" 할 때

테이블만 만들고 **권한(GRANT)** 이 없으면 저장이 실패합니다.

1. Cursor에서 `supabase/migrations/20260711000001_grant_table_privileges.sql` 파일을 엽니다.  
2. `Ctrl + A` → `Ctrl + C` (파일 **내용** 전체)  
3. Supabase **SQL Editor → New query** 에 붙여 넣기  
4. 첫 줄이 `-- Novel Studio — Table privileges` 인지 확인  
5. **Run** → Success  
6. 앱에서 작품 만들기를 다시 시도합니다.

### 준비물

- Supabase 계정과 **프로젝트** (이미 만들어 둔 것)
- Cursor에서 열 파일:  
  `supabase/migrations/20260711000000_init_novel_studio.sql`
- 앱 `.env.local` 에 URL / anon key 가 들어 있는지 확인

### 0단계 — Auth가 켜져 있는지 확인

RLS는 `auth.uid()`(로그인한 사용자 ID)로 동작합니다.

1. Supabase 대시보드 왼쪽 **Authentication**
2. **Providers** → **Email** 이 켜져 있는지 확인
3. 개발 중에는 **Confirm email** 을 꺼 두면 가입 직후 로그인하기 쉽습니다

### 1단계 — SQL Editor 열기

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) 에 로그인합니다.  
2. Novel Studio용 **프로젝트를 선택**합니다.  
3. 왼쪽 메뉴에서 **SQL Editor** 를 클릭합니다.  
4. 오른쪽 위(또는 상단) **New query** 를 누릅니다.  
   - 빈 편집 창이 열리면 성공입니다.

### 2단계 — 파일 “내용” 복사 (경로 아님!)

1. **Cursor** 왼쪽 파일 트리에서 다음을 더블클릭해 **파일을 엽니다.**

```
supabase
  └── migrations
        └── 20260711000000_init_novel_studio.sql
```

2. 에디터에 SQL이 보이면, 그 안에서:

   - Windows: `Ctrl + A` (전체 선택) → `Ctrl + C` (복사)  
   - Mac: `Cmd + A` → `Cmd + C`

3. Supabase SQL Editor 빈 칸을 클릭한 뒤 붙여 넣습니다.

   - Windows: `Ctrl + V`  
   - Mac: `Cmd + V`

4. **확인:** SQL Editor 맨 위가 이렇게 보이면 성공입니다.

```text
-- =============================================================================
-- Novel Studio — Initial Database Migration
-- =============================================================================
```

5. **실패 예:** 맨 위가 아래처럼 보이면 잘못된 것입니다. 전부 지우고 2단계부터 다시.

```text
supabase/migrations/20260711000000_init_novel_studio.sql
```

> 경로 이름만 복사하지 마세요.  
> **파일 안에 있는 `create table ...` 같은 SQL 전체**를 복사해야 합니다.

### 3단계 — Run 실행

1. SQL Editor 오른쪽 아래(또는 하단) **Run** 버튼을 누릅니다.  
2. 몇 초 기다립니다.  
3. 아래에 **Success** / 성공 메시지가 보이면 완료입니다.  
4. 빨간 에러가 나면:
   - 맨 위가 `-- Novel Studio` 주석인지 다시 확인
   - SQL을 지우고 **파일 내용 전체**를 다시 붙여 넣었는지 확인
   - 프로젝트를 잘못 고르지 않았는지 확인

같은 SQL을 **다시 Run** 해도 되도록 작성되어 있습니다  
(`create table if not exists`, `drop policy if exists`).

### 4단계 — Table Editor에서 확인

1. 왼쪽 메뉴 **Table Editor** 를 엽니다.  
2. 왼쪽에 아래 테이블이 보이면 성공입니다.

| 테이블 | 역할 |
|--------|------|
| `projects` | 작품 |
| `documents` | Document(목차) — Manuscript가 참조 |
| `manuscripts` | 원고 본문 |
| `manuscript_versions` | 원고 버전 Snapshot (명시적 저장) |
| `scenes` | Scene 상태·메모·접힘 |
| `characters` | 인물 |
| `memos` | 메모 |
| `writing_vault` | Writing Vault (대사·문장) |
| `inspirations` | 영감 노트 |
| `foreshadowings` | 복선 |
| `word_treasury` | 어휘 금고 |

3. 각 테이블을 클릭했을 때 행이 비어 있어도 정상입니다.  
   (앱에서 작품을 만들면 데이터가 들어갑니다.)

### 5단계 — RLS(보안) 확인

1. Table Editor에서 예: `projects` 테이블을 선택합니다.  
2. 오른쪽 위 **…** 또는 테이블 설정에서 **RLS enabled** 인지 확인합니다.  
   (Migration이 `enable row level security` 를 실행합니다.)  
3. **Authentication → Users** 에 본인 계정이 있는지 확인합니다.  
4. 앱에서 **회원가입/로그인** 후 작품을 하나 만듭니다.  
5. Table Editor → `projects` 를 새로고침하면 행이 보여야 합니다.  
6. 그 행의 `user_id` 가 **Authentication → Users** 의 본인 UUID 와 같으면  
   “내 데이터만” 정책이 동작하는 것입니다.

### 6단계 — 앱에서 최종 확인

1. `.env.local` 의 URL / anon key 가 **방금 Migration을 실행한 프로젝트**와 같은지 확인  
2. `npm run dev` 실행  
3. 로그인 → 작품 생성 → Chapters에서 Document 생성 → Manuscript에 글 작성  
4. 다른 기기(또는 시크릿 창)에서 **같은 계정**으로 로그인했을 때  
   같은 작품·원고가 보이면 DB 연결이 완료된 것입니다.

### 자주 하는 실수

| 증상 | 원인 / 해결 |
|------|-------------|
| `syntax error at or near "supabase"` | **파일 경로**를 붙여 넣음 → 경로 지우고 **파일 내용**(SQL) 전체를 다시 붙여 넣기 |
| Table Editor가 계속 비어 있음 | Migration을 Run 하지 않음 → 1~3단계 다시 |
| `relation does not exist` | SQL 일부만 실행됨 → 파일 **내용 전체** 다시 Run |
| 작품이 저장 안 됨 / 권한 오류 | RLS·로그인 확인, Confirm email 때문에 세션이 없을 수 있음 |
| PC와 iPad 데이터가 다름 | 예전에 LocalStorage만 쓰던 데이터 → 로그인 후 **다시 저장** 필요 |
| 다른 프로젝트 Table Editor를 봄 | 대시보드 상단에서 프로젝트 이름 확인 |
| Vercel만 실패 | Vercel 환경변수가 이 Supabase 프로젝트와 같은지, Redeploy 했는지 |

### (참고) CLI로 적용하는 경우

Supabase CLI를 쓰는 경우:

```bash
supabase db push
```

또는 SQL Editor 방식이 가장 확실합니다 (초보자 권장).

### (참고) 예전 SQL 파일

| 경로 | 상태 |
|------|------|
| `supabase/migrations/20260711000000_init_novel_studio.sql` | **권장 — 기본 테이블** |
| `supabase/migrations/20260711000001_grant_table_privileges.sql` | 권한 (필요 시) |
| `supabase/migrations/20260711000002_writing_vault_expand.sql` | Writing Vault 확장 |
| `supabase/migrations/20260711000003_manuscript_versions.sql` | 원고 버전 Snapshot |
| `supabase/migration_full_cloud.sql` | 구버전 안내용 (이름·테이블이 다를 수 있음) |
| `supabase/schema.sql` | 구버전 참고용 |

새 프로젝트는 **init SQL** 후, 필요한 추가 migration을 순서대로 실행하세요.

---

## 저장 구조 (참고)

| 구분 | 현재 |
|------|------|
| 로그인 | Supabase Auth |
| 작품 데이터 전체 | **Supabase Database** (주 저장소) |
| LocalStorage | 클라우드 성공 후 **백업** + 명시적 복원용 |
| Memo / Foreshadowing / Word Treasury UI | Coming soon (테이블·저장 계층은 준비됨) |

| 경로 | 역할 |
|------|------|
| `supabase/migrations/` | **권장** — DB Migration (테이블 + RLS) |
| `src/database/supabase/` | DB 리포지토리 · 매핑 |
| `src/features/*/lib/*-storage.ts` | Cloud CRUD + 백업 쓰기 |
| `src/lib/storage/backup.ts` | 백업 내보내기/복원 헬퍼 |
| `src/lib/supabase/` | Supabase 클라이언트 |

---

## 문서

- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/FEATURES.md`
- `docs/DESIGN.md`

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database + RLS](https://supabase.com/docs/guides/auth/row-level-security)
