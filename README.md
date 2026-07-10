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
2. 아래 **「Supabase SQL · RLS 실행」** (`supabase/schema.sql`)

### 4. 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

- 로그인 후 작품·문서·원고·대사·캐릭터·영감 노트는 **Supabase Database**에 저장됩니다.  
- LocalStorage는 **오프라인 백업**용입니다.  
- 오프라인이거나 DB 오류 시 LocalStorage로 폴백합니다.

### 5. 품질 확인 (배포 전 권장)

```bash
npm run lint
npm run build
```

`npm run build` 가 오류 없이 끝나면 프로덕션 빌드 준비가 된 것입니다.

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
| `characters` | 인물 프로필 |
| `inspirations` | 영감 노트 |

각 행에는 `user_id`가 있고, **본인 데이터만** 보이도록 RLS가 켜집니다.

이미 예전에 `schema.sql` 을 실행했다면, 추가분만 필요할 수 있습니다.

- `supabase/characters.sql`  
- `supabase/inspirations.sql`

### 3) Run 실행

1. 오른쪽 아래(또는 상단) **Run** 버튼을 누릅니다.  
2. 성공 메시지(Success)가 보이면 완료입니다.  
3. 같은 SQL을 다시 실행해도 되도록 `if not exists` / `drop policy if exists` 를 넣어 두었습니다.

### 4) RLS가 켜졌는지 확인

1. 왼쪽 **Table Editor** 를 엽니다.  
2. 위 테이블들이 보이는지 확인합니다.  
3. 앱에서 로그인한 뒤 작품을 만들어 봅니다.  
4. Table Editor에서 해당 행의 `user_id`가 본인 사용자 UUID와 같은지 확인합니다.

### 5) RLS 정책이 하는 일 (개념)

- `auth.uid()` = 지금 로그인한 사용자 ID  
- 각 테이블의 `user_id`와 같을 때만 **조회·추가·수정·삭제** 가능  

### 6) 자주 하는 실수

| 증상 | 확인 |
|------|------|
| 작품이 저장 안 됨 | `schema.sql` 을 Run 했는지 |
| 빈 목록만 보임 | 다른 계정으로 로그인했는지 (`user_id` 분리) |
| 권한 오류 | RLS 정책이 생성됐는지, Email Auth로 로그인했는지 |
| 로컬에만 남음 | 오프라인이거나 환경변수 미설정 → LocalStorage 폴백 |
| Vercel만 실패 | 환경변수 미등록 또는 Redeploy 안 함 |

---

## 저장 구조 (참고)

| 구분 | 현재 |
|------|------|
| 로그인 | Supabase Auth |
| Project / Documents / Manuscript / Dialogue / Characters / Inspiration | Supabase DB (온라인) + LocalStorage 백업 |
| Memo / Foreshadowing 등 | Coming soon (LocalStorage 자리만) |

| 경로 | 역할 |
|------|------|
| `supabase/schema.sql` | 테이블 + RLS |
| `src/database/supabase/` | DB 리포지토리 · 매핑 |
| `src/features/*/lib/*-storage.ts` | Cloud 우선 + 로컬 백업 |
| `src/lib/supabase/` | Supabase 클라이언트 |
| `next.config.ts` | Next / Vercel 빌드 설정 |

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
