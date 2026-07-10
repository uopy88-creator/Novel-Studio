# Novel Studio Data Model

이 문서는 Novel Studio의 **데이터 구조와 연결 관계**를 정리한다.  
화면/CRUD 구현 여부와 관계없이, **도메인이 어떻게 생겼는지**를 먼저 이해하기 위한 문서이다.

---

## 한 줄 요약

**모든 것은 Project(작품) 아래에 모인다.**  
세계관이 루트가 아니라, **작업실(작품)** 이 루트다.

---

## 전체 관계도

```
Project                         ← 작품 = 작업실 1개
 ├─ Document[]                  ← 문서/장 목차 (코드: Chapter)
 │    └─ Manuscript (1:1)       ← 그 문서의 실제 본문
 ├─ Character[]                 ← 인물 카드
 ├─ Dialogue[]                  ← 대사 보관함
 ├─ Foreshadowing[]             ← 복선
 └─ Memo[]                      ← 메모
```

### 이름 대응 (중요)

| 제품/문서 용어 | 현재 코드 타입 | 설명 |
|----------------|----------------|------|
| Project | `Project` | 작품 |
| Document | `Chapter` | 목차 단위 문서. 로드맵에서는 Document로 부른다 |
| Manuscript | `Manuscript` | Document에 붙는 본문 |
| Character | `Character` | 인물 |
| Dialogue | `Dialogue` | 대사 금고 항목 |
| Foreshadowing | `Foreshadowing` | 복선 |
| Memo | `Memo` | 메모 |

> 나중에 코드 이름을 `Document`로 통일할 수 있다.  
> 그 전까지는 **Document ≈ Chapter** 로 읽으면 된다.

---

## 연결 원칙

초보자도 기억하기 쉬운 규칙 3가지.

1. **거의 모든 데이터는 `projectId`를 가진다**  
   → “이 데이터가 어느 작품 것인가?”가 항상 명확하다.

2. **강한 연결 / 느슨한 연결을 나눈다**  
   - 강함: Document ↔ Manuscript (문서 없이 본문만 두지 않음)  
   - 느슨: Dialogue → Character (누구 대사인지 몰라도 저장 가능)

3. **목록과 본문을 분리한다**  
   - Document = 제목·순서·짧은 설명  
   - Manuscript = 길고 자주 저장되는 본문

---

## 엔티티별 설명

### Project

작품(작업실)의 루트.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| title | 작품 제목 |
| premise / description | 짧은 소개 |
| status | 집필 단계 (구상, 초고, 퇴고 등) |
| sortOrder | 목록 정렬 |
| createdAt / updatedAt | 생성·수정 시각 |

**관계**

- Project 1 ── * Document
- Project 1 ── * Character
- Project 1 ── * Dialogue
- Project 1 ── * Foreshadowing
- Project 1 ── * Memo

---

### Document

작품 안의 **문서 단위** (장/편/섹션).  
목차 관리의 중심이다.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 |
| title | 문서 제목 |
| number / sortOrder | 순서. UI에서는 1화, 2화처럼 번호로 표시 |
| summary / description | 간단한 설명 |
| createdAt / updatedAt | 생성·수정 시각 |

**관계**

- Project 1 ── * Document
- Document 1 ── 1 Manuscript

원고 본문은 Document에 직접 넣지 않는다.  
본문은 Manuscript로 분리한다.

---

### Manuscript

Document에 연결된 **실제 원고 본문**.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 (조회 편의) |
| documentId / chapterId | 연결된 Document |
| content | 본문 |
| plainText | 통계·검색용 순수 텍스트 |
| wordCount | 분량 캐시 |
| createdAt / updatedAt | 생성·수정 시각 |

**관계**

- Document 1 ── 1 Manuscript

분량 지표(글자수, 공백 제외, 원고지, 예상 페이지)는  
Manuscript의 텍스트에서 계산한다.

---

### Character

집필 중 바로 열어보는 **인물 카드**.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 |
| name | 이름 |
| role | 주인공/조연 등 (가벼운 분류) |
| summary | 한두 문장 요약 |
| notes | 자유 노트 |

**관계**

- Project 1 ── * Character
- Dialogue.characterId → Character? (선택)
- Memo.characterId → Character? (선택)

---

### Dialogue

대사 보관함 항목.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 |
| text | 대사 본문 |
| characterId | 누가 말했는지 (선택) |
| documentId / chapterId | 어느 문서와 관련인지 (선택) |
| context | 상황 메모 |
| tags | 자유 태그 |

**관계**

- Project 1 ── * Dialogue
- Character? ← 느슨한 연결
- Document? ← 느슨한 연결

아직 배치할 문서를 몰라도 먼저 저장할 수 있어야 한다.

---

### Foreshadowing

복선 추적.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 |
| title | 짧은 이름 |
| description | 설명 |
| status | planned / planted / paid_off / dropped |
| plantedDocumentId | 심은 문서 |
| payoffDocumentId | 회수할(한) 문서 |
| relatedCharacterIds | 관련 인물 |

**관계**

- Project 1 ── * Foreshadowing
- Document? ← 심기 / 회수 위치
- Character[] ← 관련 인물 (선택)

---

### Memo

가장 가벼운 기록.

| 필드 개념 | 설명 |
|-----------|------|
| id | 고유 ID |
| projectId | 소속 작품 |
| body | 메모 내용 |
| kind | idea / todo / question / note |
| documentId | 문서에 붙이기 (선택) |
| characterId | 인물에 붙이기 (선택) |
| foreshadowingId | 복선에 붙이기 (선택) |

**관계**

- Project 1 ── * Memo
- Document? / Character? / Foreshadowing? 에 선택 연결

---

## 저장 방식 (현재)

| 데이터 | 저장소 | 비고 |
|--------|--------|------|
| Project | LocalStorage (`novel-studio:projects`) | 구현됨 |
| Document (Chapter) | LocalStorage (`novel-studio:chapters`) | 구현됨 |
| Manuscript 외 | — | 타입 설계 위주, 기능은 로드맵 따름 |

클라우드 동기화는 **v0.3**에서 다룬다.  
그때도 도메인 모델(이 문서)은 최대한 유지하고, 저장 계층만 바꾼다.

---

## 관련 코드 위치

| 개념 | 타입 경로 |
|------|-----------|
| Project | `src/features/projects/types/` |
| Document (Chapter) | `src/features/manuscript/types/chapter.ts` |
| Manuscript | `src/features/manuscript/types/manuscript.ts` |
| Character | `src/features/characters/types/` |
| Dialogue | `src/features/dialogue-vault/types/` |
| Foreshadowing | `src/features/foreshadowing/types/` |
| Memo | `src/features/memo/types/` |
| 관계 개념 | `src/types/project-tree.ts` |

---

## 관련 문서

- [FEATURES.md](./FEATURES.md)
- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
