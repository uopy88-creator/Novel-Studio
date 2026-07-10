# Novel Studio

소설·시·에세이 등 **창작 프로젝트를 관리하는 작업실**입니다.  
AI가 글을 대신 쓰는 프로그램이 아닙니다.

기술 스택: **Next.js 15** · **React 19** · **TypeScript** · **Tailwind CSS** · **Supabase Auth + Database**

---

## 현재 실행 방법

프로젝트 루트(`novel-studio`)에서 아래 순서대로 실행합니다.

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수

```powershell
# Windows PowerShell
Copy-Item .env.local.example .env.local
```

```bash
# macOS / Linux
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Supabase Auth + Database 준비

1. 아래 **「Supabase Auth 설정」**  
2. 아래 **「Supabase SQL · RLS 실행」** (`supabase/schema.sql`)

### 4. 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

- 로그인 후 Project / Documents / Manuscript / Dialogue Vault 는 **Supabase Database**에 저장됩니다.  
- LocalStorage는 **오프라인 백업**용입니다.  
- 오프라인이거나 DB 오류 시 LocalStorage로 폴백합니다.

### 5. 품질 확인 (선택)

```bash
npm run lint
npm run build
```

---

## Supabase Auth 설정 (초보자용)

1. [https://supabase.com](https://supabase.com) → 프로젝트 생성  
2. **Authentication** → **Providers** → **Email** 활성화  
3. 개발 중에는 **Confirm email** 끄기 (가입 직후 로그인)  
4. **Project Settings** → **API** 에서 URL / anon key 를 `.env.local`에 넣기  
5. `npm run dev` 재시작  

> `service_role` 키는 프론트엔드·Git에 넣지 마세요.

---

## Supabase SQL · RLS 실행 (초보자용)

작품 데이터를 클라우드에 저장하려면 **테이블 + RLS**를 한 번 실행해야 합니다.

### 1) SQL Editor 열기

1. Supabase 대시보드에 로그인합니다.  
2. 왼쪽 메뉴에서 **SQL Editor** 를 클릭합니다.  
3. **New query** 를 누릅니다.

### 2) SQL 붙여 넣기

1. 프로젝트의 `supabase/schema.sql` 파일을 엽니다.  
2. **전체 내용**을 복사합니다.  
3. SQL Editor에 붙여 넣습니다.

이 SQL이 만드는 것:

| 테이블 | 내용 |
|--------|------|
| `projects` | 작품 |
| `documents` | 문서(목차) |
| `manuscripts` | 원고 본문 |
| `dialogues` | 대사 금고 |

각 행에는 `user_id`가 있고, **본인 데이터만** 보이도록 RLS가 켜집니다.

### 3) Run 실행

1. 오른쪽 아래(또는 상단) **Run** 버튼을 누릅니다.  
2. 성공 메시지(Success)가 보이면 완료입니다.  
3. 같은 SQL을 다시 실행해도 되도록 `if not exists` / `drop policy if exists` 를 넣어 두었습니다.

### 4) RLS가 켜졌는지 확인

1. 왼쪽 **Table Editor** 를 엽니다.  
2. `projects`, `documents`, `manuscripts`, `dialogues` 테이블이 보이는지 확인합니다.  
3. 왼쪽 **Authentication** → 사용자로 로그인한 뒤 앱에서 작품을 만들어 봅니다.  
4. Table Editor에서 해당 행의 `user_id`가 본인 사용자 UUID와 같은지 확인합니다.

### 5) RLS 정책이 하는 일 (개념)

- `auth.uid()` = 지금 로그인한 사용자 ID  
- 각 테이블의 `user_id`와 같을 때만 **조회·추가·수정·삭제** 가능  
- 다른 사용자의 행은 앱에서도 SQL Editor(일반 역할)에서도 보이지 않습니다.

정책 이름은 예를 들어:

- `projects_select_own` / `projects_insert_own` / `projects_update_own` / `projects_delete_own`  
- documents / manuscripts / dialogues 도 동일 패턴  

확인 경로: **Authentication** 이 아니라 **Table Editor** → 테이블 선택 → **RLS** / **Policies** (UI 버전에 따라 **Database** → **Policies**).

### 6) 자주 하는 실수

| 증상 | 확인 |
|------|------|
| 작품이 저장 안 됨 | `schema.sql` 을 Run 했는지 |
| 빈 목록만 보임 | 다른 계정으로 로그인했는지 (`user_id` 분리) |
| 권한 오류 | RLS 정책이 생성됐는지, Email Auth로 로그인했는지 |
| 로컬에만 남음 | 오프라인이거나 `.env.local` 미설정 → LocalStorage 폴백 |

---

## 저장 구조 (참고)

| 구분 | 현재 |
|------|------|
| 로그인 | Supabase Auth |
| Project / Documents / Manuscript / Dialogue | Supabase DB (온라인) + LocalStorage 백업 |
| Characters / Memo 등 | LocalStorage만 (미구현 CRUD) |

| 경로 | 역할 |
|------|------|
| `supabase/schema.sql` | 테이블 + RLS |
| `src/database/supabase/` | DB 리포지토리 · 매핑 |
| `src/features/*/lib/*-storage.ts` | Cloud 우선 + 로컬 백업 |
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
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database + RLS](https://supabase.com/docs/guides/auth/row-level-security)
