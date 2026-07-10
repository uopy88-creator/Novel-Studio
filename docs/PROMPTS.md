# Novel Studio — Cursor Prompts

이 프로젝트를 만들며 Cursor에 요청한 프롬프트를 **작업 순서대로** 정리한다.  
세부 문장은 요약·재구성했으며, 의도와 제약은 유지했다.

---

## 1. 프로젝트 시작

- Novel Studio 신규 프로젝트
- Next.js 15 · React 19 · TypeScript · Tailwind
- “소설 작성기”가 아니라 **소설 프로젝트 관리 작업실**
- 순서: 생성 → 실행 확인 → 폴더 구조 (한 단계씩)
- 기능은 만들지 말 것

## 2. 폴더 구조 설계

- 유지보수·확장성 우선
- 예정 기능(Project, Dashboard, Manuscript, Characters, …)을 고려한 `src` 구조
- 폴더만 생성, 코드·기능 없음
- 각 폴더 역할 설명

## 3. 디자인 시스템

- Notion / Obsidian / Linear 톤
- 흰색 · 연회색 · 포인트 블루 · 둥근 모서리 · 카드 · 여백 · iPad
- Color · Typography · Spacing · Button · Card · Input · Modal
- `components/ui`에 배치, Dashboard/Manuscript 만들지 말 것

## 4. 데이터 구조

- 화면·CRUD 없이 TypeScript interface만
- Project 중심 관계 설계
- 폴더 구조 변경 금지, 주석·초보자 설명

## 5. Project 기능

- 생성 · 수정 · 삭제 · 목록
- 모달로 제목·설명, LocalStorage
- 카드 클릭 → “Dashboard 준비 중” (Dashboard 본구현 금지)
- ProjectCard · ProjectList · ProjectModal

## 6. 공통 Layout

- AppLayout · Sidebar · Header · ContentContainer
- 메뉴 클릭 시 “준비 중”, 사이드바 접기/펼치기
- Header는 작품 제목만, Dashboard 기능 구현 금지

## 7. Chapter / Document 관리

- 실행 확인 후 Chapter CRUD · 위아래 순서
- 이후 Document로 개선: 제목 · 종류(소설/시/에세이/기타)
- 카드 클릭 → Manuscript, 기본 제목 “새 문서”
- DocumentCard · DocumentList · DocumentModal

## 8. Dashboard

- 보기 전용 통계 카드 (글자수 · 원고지 · 책 페이지 · 최근 Document 등)
- 200자=1매, 250자=1페이지, 반응형 그리드
- DashboardCard · StatisticsGrid · RecentDocumentCard

## 9. Manuscript

- Document 선택 → 큰 에디터
- 자동 저장 · 저장 상태 · 원고 내 검색 · 우측 통계
- ManuscriptEditor · SearchBar · StatisticsPanel · AutoSaveIndicator

## 10. Dialogue Vault

- 원고와 독립된 대사 보관
- CRUD · 내용+태그 검색 · 즐겨찾기 상단 고정
- DialogueCard · DialogueList · DialogueModal · DialogueSearchBar

## 11. 리팩토링

- 새 기능/UI/페이지 없음
- 중복 제거 · 구조 · 타입 · LocalStorage · 성능
- 기존 기능 유지

## 12. Auth / Sync 구조만

- 로그인·Supabase 연결·로그인 화면 없음
- auth · services · database · `.env.local.example`
- Storage Layer로 Local ↔ Supabase 교체 준비

## 13. 공통 작업 규칙 (반복)

여러 단계에서 공통으로 요청된 제약:

- 기존 코드 전체 교체·삭제 금지, 필요한 부분만 추가·수정
- 기존 컴포넌트 재사용
- 새 기능이 기존 기능을 깨지 말 것
- 시작 전 실행/빌드로 오류 확인, 있으면 먼저 수정
- 끝나면 생성된 파일 목록(또는 요청한 형식)만 설명

## 14. 문서화 (이번 요청)

- `docs`에 PRODUCT · ROADMAP · FEATURES · DESIGN · PROMPTS · IDEA
- 기존 기능 코드는 수정하지 말 것
