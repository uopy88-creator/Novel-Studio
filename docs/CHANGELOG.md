# Changelog

Novel Studio의 버전별 변경 사항을 기록한다.  
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 스타일을 참고한다.

버전 계획은 [ROADMAP.md](./ROADMAP.md)를 본다.

---

## [Unreleased]

아직 릴리스에 넣지 않은 작업.

### Added

- 프로젝트 문서 (`docs/ROADMAP.md`, `FEATURES.md`, `DATA_MODEL.md`, `UI_GUIDE.md`, `CHANGELOG.md`)

---

## [0.1.0] — 진행 중

v0.1 로컬 작업실 핵심. 완료된 항목과 남은 항목을 함께 적는다.

### Added

#### 기반

- Next.js 15 + React 19 + TypeScript + Tailwind CSS 프로젝트 구성
- 확장 가능한 `src/` 폴더 구조 (`app`, `features`, `components`, `types` 등)
- 디자인 시스템 토큰 및 UI 프리미티브 (Button, Card, Input, Modal)
- 도메인 타입 설계 (Project, Chapter/Document, Manuscript, Character, Dialogue, Foreshadowing, Memo, Settings, Writing Statistics)

#### Project

- 작품 생성 / 수정 / 삭제 / 목록
- LocalStorage 저장 (`novel-studio:projects`)
- 작품 카드 클릭 시 작업실 진입

#### Layout

- 공통 작업실 레이아웃 (AppLayout, Sidebar, Header, ContentContainer)
- 사이드바 접기/펼치기 (PC / iPad 고려)
- 메뉴 클릭 시 미구현 기능은 「준비 중」 페이지

#### Document (Chapter)

- 챕터(문서) 생성 / 수정 / 삭제
- 위·아래 버튼으로 순서 변경
- LocalStorage 저장 (`novel-studio:chapters`)
- 사이드바 Chapters 메뉴 연결

### Not yet (v0.1 남은 항목)

- Manuscript (원고 본문 작성)
- Characters
- Memo
- 분량 지표 UI (글자수, 공백 제외, 원고지, 예상 책 페이지)

---

## 버전 기록 규칙

1. **Added** — 새 기능
2. **Changed** — 기존 동작 변경
3. **Fixed** — 버그 수정
4. **Removed** — 제거된 기능

의미 있는 단위로 묶어서 적는다.  
사소한 오타 수정까지 모두 적을 필요는 없다.
