/**
 * Manuscript @멘션 유틸.
 * 텍스트에 `@이름` 형태로 저장하고, 클릭 가능한 태그 UI는 별도 칩으로 표시한다.
 */

import type { Character } from "@/features/characters/types/character";

/** 커서 앞의 `@query` 패턴 */
export function getMentionQueryAtCursor(
  text: string,
  cursor: number,
): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([^\s@]*)$/);
  if (!match) return null;
  return {
    start: cursor - match[0].length,
    query: match[1] ?? "",
  };
}

export function filterMentionCandidates(
  characters: Character[],
  query: string,
): Character[] {
  const needle = query.trim().toLowerCase();
  const list = [...characters].sort((a, b) =>
    a.name.localeCompare(b.name, "ko"),
  );
  if (!needle) return list.slice(0, 8);
  return list
    .filter((character) => {
      const haystacks = [character.name, character.nickname, character.intro]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(needle));
    })
    .slice(0, 8);
}

/** `@query` 구간을 `@이름 ` 으로 교체 */
export function insertMentionAtCursor(params: {
  text: string;
  cursor: number;
  mentionStart: number;
  name: string;
}): { nextText: string; nextCursor: number } {
  const token = `@${params.name}`;
  const before = params.text.slice(0, params.mentionStart);
  const after = params.text.slice(params.cursor);
  const nextText = `${before}${token} ${after}`;
  const nextCursor = before.length + token.length + 1;
  return { nextText, nextCursor };
}

/**
 * 본문에서 등장하는 캐릭터 (긴 이름 우선 매칭).
 */
export function findMentionedCharacters(
  text: string,
  characters: Character[],
): Character[] {
  if (!text || characters.length === 0) return [];

  const byLength = [...characters].sort(
    (a, b) => b.name.length - a.name.length,
  );
  const found: Character[] = [];
  const used = new Set<string>();

  for (const character of byLength) {
    if (!character.name) continue;
    const token = `@${character.name}`;
    if (text.includes(token) && !used.has(character.id)) {
      used.add(character.id);
      found.push(character);
    }
  }

  return found;
}

/**
 * 커서가 `@이름` 토큰 안( @ 포함 ~ 이름 끝 )이면 해당 캐릭터를 반환.
 * 이름이 겹치면 더 긴 이름을 우선한다.
 */
export function findCharacterAtCursor(
  text: string,
  cursor: number,
  characters: Character[],
): Character | null {
  if (!text || characters.length === 0) return null;

  const byLength = [...characters]
    .filter((character) => character.name.trim().length > 0)
    .sort((a, b) => b.name.length - a.name.length);

  for (const character of byLength) {
    const token = `@${character.name}`;
    let from = 0;
    while (from <= text.length) {
      const index = text.indexOf(token, from);
      if (index < 0) break;

      const end = index + token.length;
      // 토큰 경계: 뒤에 공백/@/끝이어야 부분 매칭 방지
      const next = text[end];
      const isBoundary = next === undefined || next === " " || next === "\n" || next === "\t" || next === "@";
      if (isBoundary && cursor >= index && cursor <= end) {
        return character;
      }
      from = index + 1;
    }
  }

  return null;
}

/**
 * 원고 본문의 `@oldName` 을 `@newName` 으로 교체.
 * 부분 문자열(@김 vs @김민준)은 건드리지 않는다.
 */
export function replaceMentionNameInText(
  text: string,
  oldName: string,
  newName: string,
): string {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || from === to) return text;

  const oldToken = `@${from}`;
  const newToken = `@${to}`;
  let result = "";
  let i = 0;

  while (i < text.length) {
    const index = text.indexOf(oldToken, i);
    if (index < 0) {
      result += text.slice(i);
      break;
    }

    result += text.slice(i, index);
    const end = index + oldToken.length;
    const next = text[end];
    const isBoundary =
      next === undefined ||
      next === " " ||
      next === "\n" ||
      next === "\t" ||
      next === "@";

    if (isBoundary) {
      result += newToken;
      i = end;
    } else {
      result += oldToken;
      i = end;
    }
  }

  return result;
}
