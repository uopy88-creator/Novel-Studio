/**
 * Quick self-test for mention helpers.
 * Run: npx --yes tsx src/features/characters/lib/mention.selftest.ts
 */

import assert from "node:assert/strict";
import type { Character } from "@/features/characters/types/character";
import {
  filterMentionCandidates,
  findCharacterAtCursor,
  getMentionQueryAtCursor,
  replaceMentionNameInText,
} from "@/features/characters/lib/mention";

function char(
  partial: Pick<Character, "id" | "name"> & Partial<Character>,
): Character {
  return {
    id: partial.id,
    projectId: "p1",
    name: partial.name,
    nickname: partial.nickname ?? "",
    status: partial.status ?? "",
    intro: partial.intro ?? "",
    role: partial.role ?? "",
    age: "",
    gender: "",
    occupation: "",
    personality: "",
    goal: "",
    secret: "",
    memo: "",
    image: "",
    color: "#2563eb",
    isFavorite: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const cast = [
  char({ id: "1", name: "김민준", nickname: "민준이", intro: "기자" }),
  char({ id: "2", name: "김", nickname: "", intro: "짧은 이름" }),
  char({ id: "3", name: "이수진", nickname: "수지", intro: "탐정" }),
];

// getMentionQueryAtCursor
assert.deepEqual(getMentionQueryAtCursor("안녕 @김", 5), {
  start: 3,
  query: "김",
});
assert.equal(getMentionQueryAtCursor("안녕 김", 4), null);

// filterMentionCandidates — name / nickname / intro
assert.equal(filterMentionCandidates(cast, "민준").length, 1);
assert.equal(filterMentionCandidates(cast, "수지")[0]?.id, "3");
assert.equal(filterMentionCandidates(cast, "탐정")[0]?.id, "3");
assert.equal(filterMentionCandidates(cast, "없는이름").length, 0);

// replaceMentionNameInText — exact token only
assert.equal(
  replaceMentionNameInText("어제 @김민준 이 왔다. @김 도.", "김민준", "민준"),
  "어제 @민준 이 왔다. @김 도.",
);
assert.equal(
  replaceMentionNameInText("만나 @김 하세요", "김", "박"),
  "만나 @박 하세요",
);
assert.equal(
  replaceMentionNameInText("만나 @김민준 하세요", "김", "박"),
  "만나 @김민준 하세요",
);

// findCharacterAtCursor — longest name wins
const text = "오늘 @김민준 이 말했다";
const atMinjun = text.indexOf("@김민준") + 2; // inside longer name
assert.equal(findCharacterAtCursor(text, atMinjun, cast)?.id, "1");
assert.equal(findCharacterAtCursor(text, 0, cast), null);

console.log("mention.selftest: all passed");
