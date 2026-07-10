# Novel Studio — Features

기능 현황과 우선순위.

제품 목표는 [PRODUCT.md](./PRODUCT.md), 일정은 [ROADMAP.md](./ROADMAP.md)를 본다.

---

## 현재 구현된 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| Project | 완료 | LocalStorage CRUD, 작품 목록 |
| 공통 Layout | 완료 | Sidebar · Header · 접기/펼치기 |
| Documents | 완료 | 제목 · 종류, 카드 → Manuscript |
| Manuscript (Editor) | 완료 | 자동 저장 · 원고 내 검색 · 통계 패널 |
| Dashboard | 완료 | 분량 지표 · 최근 Document (보기 전용) |
| Dialogue Vault | 완료 | 추가/수정/삭제 · 검색 · 즐겨찾기 |
| 디자인 시스템 | 완료 | Button · Card · Input · Modal, 토큰 |
| Auth / Sync **구조** | 준비만 | 로그인·Supabase 연결은 아직 없음 |

---

## 앞으로 구현할 기능

### v1.0 남은 항목

- Characters
- Memo

### v1.5

- Word Vault
- Inspirations
- Foreshadowing

### v2.0

- Login
- Cloud Sync
- 작품 전체 Search
- Dictionary API (예: 국립국어원)

---

## 우선순위

높음 → 낮음 순.

1. **Characters** — Dashboard 카운트와 키가 이미 맞물려 있음  
2. **Memo** — 집필 중 빠른 기록, v1.0 완성  
3. **Foreshadowing** — 복선 추적 (집필 보조)  
4. **Word Vault / Inspirations** — 어휘·영감 보관  
5. **Login + Cloud Sync** — 구조(`auth` / `services` / `database`)는 준비됨  
6. **Search / Dictionary API** — 외부 연동 · 크로스 검색  

---

## 의도적으로 아직 안 하는 것

- AI 대필을 제품 핵심으로 두기
- 로그인 없이 클라우드 강제
- 과한 세계관 위키 UI
