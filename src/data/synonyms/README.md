# Synonym DB (표현 바꾸기)

Novel Studio 자체 유의어 데이터입니다. AI를 사용하지 않습니다.

## 파일 추가 방법

1. 이 폴더에 `category-name.json` 을 추가합니다.
2. `index.ts` 에서 import 한 뒤 `SYNONYM_CATALOGS` 배열에 넣습니다.

```ts
import myCategory from "./my-category.json";

export const SYNONYM_CATALOGS = [
  // ...
  myCategory,
];
```

## JSON 규칙

- 키: 표제어 (검색어)
- 값: 유의어 배열 (최대 5개, 가나다순 — 로더가 다시 정렬·자름)

```json
{
  "슬프다": ["비통하다", "서글프다", "애달프다", "우울하다", "침울하다"]
}
```
