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
    .filter((character) => character.name.toLowerCase().includes(needle))
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
