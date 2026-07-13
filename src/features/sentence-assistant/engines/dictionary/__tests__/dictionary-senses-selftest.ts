/**
 * Self-test: 다의어(sense) 파싱 — 최대 2개, 중복 제거, 순서 유지
 * Run: npm run test:dictionary-senses
 */

import assert from "node:assert/strict";
import { DICTIONARY_MAX_SENSES } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { parseStdictEntry } from "@/features/sentence-assistant/engines/dictionary/parse-stdict";

function channel(items: unknown) {
  return { channel: { item: items } };
}

assert.equal(DICTIONARY_MAX_SENSES, 2);

// 1) 의미 1개 — 기존과 동일하게 하나만
{
  const entry = parseStdictEntry(
    channel({
      word: "걷다",
      pos: "동사",
      sense: { definition: "발을 번갈아 옮겨 움직이다.", pos: "동사" },
    }),
    "걷다",
  );
  assert.ok(entry);
  assert.equal(entry!.senses.length, 1);
  assert.equal(entry!.word, "걷다");
  assert.equal(entry!.definition, "발을 번갈아 옮겨 움직이다.");
  assert.equal(entry!.pos, "동사");
  assert.equal(entry!.senses[0].pos, "동사");
}

// 2) 의미 2개 (한 item)
{
  const entry = parseStdictEntry(
    channel({
      word: "열다",
      sense: [
        { definition: "닫혀 있는 것을 통하게 하다.", pos: "동사" },
        { definition: "모임을 시작하다.", pos: "동사" },
      ],
    }),
    "열다",
  );
  assert.ok(entry);
  assert.equal(entry!.senses.length, 2);
  assert.equal(entry!.senses[0].definition, "닫혀 있는 것을 통하게 하다.");
  assert.equal(entry!.senses[1].definition, "모임을 시작하다.");
}

// 3) 의미 3개 이상 → 앞의 2개만
{
  const entry = parseStdictEntry(
    channel({
      word: "가다",
      sense: [
        { definition: "뜻1", pos: "동사" },
        { definition: "뜻2", pos: "동사" },
        { definition: "뜻3", pos: "동사" },
        { definition: "뜻4", pos: "동사" },
      ],
    }),
    "가다",
  );
  assert.ok(entry);
  assert.equal(entry!.senses.length, 2);
  assert.equal(entry!.senses[0].definition, "뜻1");
  assert.equal(entry!.senses[1].definition, "뜻2");
}

// 4) 동음이의어 — 여러 item, API 순서 유지 (예: 신)
{
  const entry = parseStdictEntry(
    channel([
      {
        word: "신",
        pos: "명사",
        sense: { definition: "사람을 초월한 절대적 존재.", pos: "명사" },
      },
      {
        word: "신",
        pos: "명사",
        sense: { definition: "발에 신는 물건.", pos: "명사" },
      },
      {
        word: "신",
        pos: "명사",
        sense: { definition: "세 번째 의미는 숨김.", pos: "명사" },
      },
    ]),
    "신",
  );
  assert.ok(entry);
  assert.equal(entry!.word, "신");
  assert.equal(entry!.senses.length, 2);
  assert.equal(entry!.senses[0].definition, "사람을 초월한 절대적 존재.");
  assert.equal(entry!.senses[1].definition, "발에 신는 물건.");
  assert.equal(entry!.senses[0].pos, "명사");
  assert.equal(entry!.senses[1].pos, "명사");
}

// 5) 품사가 다른 경우
{
  const entry = parseStdictEntry(
    channel([
      {
        word: "바람",
        sense: { definition: "기압 차로 생기는 공기의 흐름.", pos: "명사" },
      },
      {
        word: "바람",
        sense: { definition: "어떤 일이 이루어지기를 望み 기다리다.", pos: "동사" },
      },
    ]),
    "바람",
  );
  assert.ok(entry);
  assert.equal(entry!.senses.length, 2);
  assert.equal(entry!.senses[0].pos, "명사");
  assert.equal(entry!.senses[1].pos, "동사");
}

// 6) 중복 뜻풀이 제거 (공백 차이 포함)
{
  const entry = parseStdictEntry(
    channel({
      word: "중복",
      sense: [
        { definition: "같은 뜻이다.", pos: "명사" },
        { definition: " 같은  뜻이다. ", pos: "명사" },
        { definition: "다른 뜻이다.", pos: "명사" },
      ],
    }),
    "중복",
  );
  assert.ok(entry);
  assert.equal(entry!.senses.length, 2);
  assert.equal(entry!.senses[0].definition, "같은 뜻이다.");
  assert.equal(entry!.senses[1].definition, "다른 뜻이다.");
}

// 7) item.pos 만 있고 sense.pos 없음 → item 품사 사용
{
  const entry = parseStdictEntry(
    channel({
      word: "책",
      pos: "명사",
      sense: { definition: "글이나 그림을 묶어 놓은 물건." },
    }),
    "책",
  );
  assert.ok(entry);
  assert.equal(entry!.senses[0].pos, "명사");
}

// 8) 없는 단어 / 빈 응답
{
  assert.equal(parseStdictEntry({}, "없음"), null);
  assert.equal(parseStdictEntry(channel([]), "없음"), null);
  assert.equal(
    parseStdictEntry(channel({ word: "빈", sense: { definition: "  " } }), "빈"),
    null,
  );
}

// 9) 품사 없음 → null (표시 생략용)
{
  const entry = parseStdictEntry(
    channel({
      word: "무품사",
      sense: { definition: "품사 없는 뜻." },
    }),
    "무품사",
  );
  assert.ok(entry);
  assert.equal(entry!.senses[0].pos, null);
}

console.log("dictionary-senses-selftest: ok");
