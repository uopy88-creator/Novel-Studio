# Synonym DB (표현 바꾸기)

Novel Studio 자체 유의어 데이터입니다. AI를 사용하지 않습니다.

## Emotion Pack

`emotion.json` — 감정 표제어 300개 이상.

- 단어당 유의어 최대 5개
- 가나다순 정렬
- 목록 내 중복 없음
- 일상 한국어만 (사투리·고어·비속어·은어·지나친 문어·전문용어 제외)

재생성:

```bash
node scripts/build-emotion-synonyms.mjs
```

## 파일 추가 방법

1. 이 폴더에 `category-name.json` 을 추가합니다.
2. `index.ts` 에서 import 한 뒤 `SYNONYM_CATALOGS` 배열에 넣습니다.

## JSON 규칙

```json
{
  "슬프다": ["비통하다", "서글프다", "애달프다", "우울하다", "침울하다"]
}
```
