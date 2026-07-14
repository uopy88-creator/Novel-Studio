# Section Registry SSOT — Architecture Notes

## 1. 새 아키텍처

```
Project
  → Document (primary Manuscript)
    → Manuscript content (파서: Section 편집·오프셋)
      → publishSections()
        → Section Registry (SSOT: id / number / title)
          → Timeline / Memo / Foreshadowing / Inspiration / Search / AI
```

- **목록의 원본:** Section Registry 만.
- **본문·오프셋의 원본:** Manuscript content (`parseSections`) — 편집 전용.
- **Writing Vault:** 텍스트 전용. Section/Document 링크 없음.
- **연결 저장:** 각 기능은 `sectionId`(= `SectionRef.id`, 저장 필드명 `sectionStableId`) **ID만** 저장. 객체 복제 금지.

## 2. 제거·정리한 Legacy

| Legacy | 조치 |
|--------|------|
| 기능별 Section 목록 생성 | Timeline `timelineOptionsFromSectionRefs` 직접 사용 → `useSectionOptions` |
| search-index inline `.find` | `resolveSectionLabel` / `listSections` |
| SentenceAssistant 빈 Registry 구독 | 제거 |
| Characters `getSectionRegistrySnapshot` for deeplink | `getPrimaryDocumentId` |
| `chapterId` / planted·payoff chapter **신규 쓰기** | 타입·주석으로 금지 (읽기 호환 유지) |
| Writing Vault `documentId`/`sectionStableId` | 이미 금지 유지 |

## 3. 변경된 Helper (권장 진입점)

| API | 용도 |
|-----|------|
| `getSectionRegistry(projectId)` | 스냅샷 |
| `getSection(projectId, sectionId)` | 단건 |
| `listSections(projectId)` | 목록 |
| `listSectionOptions(projectId)` | select 옵션 |
| `getPrimaryDocumentId(projectId)` | 딥링크 Document |
| `resolveSectionLabel(projectId, sectionId)` | `#N 제목` |
| `findSectionIdAtOffset(content, offset)` | 위치→ID |
| `getProjectSectionContext(projectId)` | AI/교차 기능 읽기 모델 |
| `useSectionOptions` / `useSectionLabel` | React 구독 |

하위 호환: `getSectionRegistrySnapshot`, `findSectionStableIdAtOffset`, `sectionStableId` 필드명.

## 4. 새 기능 추가 방법

1. Section 목록이 필요하면 **절대** `parseSections` / Documents 순회로 목록을 만들지 않는다.
2. `useSectionOptions(projectId)` 또는 `listSectionOptions(projectId)` 사용.
3. 연결은 `sectionId` 문자열만 저장한다.
4. 라벨은 `useSectionLabel` / `resolveSectionLabel`.
5. 딥링크 Document 는 `getPrimaryDocumentId` — Document ID를 Section 소스로 쓰지 않는다.
6. AI 기능은 `getProjectSectionContext(projectId)` 로 시작.

Manuscript 편집·오프셋 해석만 `parseSections` / `findSectionIdAtOffset` 허용.
