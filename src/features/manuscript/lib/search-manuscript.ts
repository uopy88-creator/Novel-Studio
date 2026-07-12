/**
 * 원고 검색 — 단어 / 문장(구문) 모드
 *
 * 색상 마커(·ns:fg:…)는 검색에 영향을 주지 않는다.
 * 매치 오프셋은 저장본(storage) 좌표로 반환한다 (점프·딥링크용).
 */

import { stripManuscriptMarkupWithMap } from "@/features/manuscript/lib/manuscript-markup";

export type ManuscriptSearchMode = "word" | "sentence";

export interface ManuscriptSearchMatch {
  index: number;
  start: number;
  end: number;
  preview: string;
}

const PREVIEW_RADIUS = 28;

function buildPreview(content: string, start: number, end: number): string {
  const previewStart = Math.max(0, start - PREVIEW_RADIUS);
  const previewEnd = Math.min(content.length, end + PREVIEW_RADIUS);
  const slice = content.slice(previewStart, previewEnd);
  return (
    (previewStart > 0 ? "…" : "") +
    slice +
    (previewEnd < content.length ? "…" : "")
  );
}

/** 문장·구문 검색 — 대소문자 무시 부분 문자열(모든 출현) */
function findSentenceMatches(
  content: string,
  query: string,
): ManuscriptSearchMatch[] {
  const haystack = content.toLowerCase();
  const needle = query.toLowerCase();
  const matches: ManuscriptSearchMatch[] = [];
  let index = 1;
  let from = 0;

  while (from <= haystack.length - needle.length) {
    const foundAt = haystack.indexOf(needle, from);
    if (foundAt < 0) break;

    const start = foundAt;
    const end = start + query.length;
    matches.push({
      index,
      start,
      end,
      preview: buildPreview(content, start, end),
    });
    index += 1;
    from = foundAt + Math.max(1, needle.length);
  }

  return matches;
}

/** 단어 단위 — 유니코드 글자 경계를 최대한 존중 */
function findWordMatches(
  content: string,
  query: string,
): ManuscriptSearchMatch[] {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 앞뒤가 글자/숫자가 아닐 때만 매치 (한글·영문 공통)
  const re = new RegExp(
    `(^|[^\\p{L}\\p{N}_])(${escaped})(?=[^\\p{L}\\p{N}_]|$)`,
    "giu",
  );
  const matches: ManuscriptSearchMatch[] = [];
  let index = 1;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    const prefix = match[1] ?? "";
    const start = match.index + prefix.length;
    const end = start + query.length;
    matches.push({
      index,
      start,
      end,
      preview: buildPreview(content, start, end),
    });
    index += 1;
    if (match.index === re.lastIndex) re.lastIndex += 1;
  }

  return matches;
}

/**
 * mode
 * - word: 단어 경계 매치
 * - sentence: 문장·구문(부분 문자열) 검색
 *
 * content 에 색상 마커가 있어도 순수 텍스트만 검색한다.
 * 반환 start/end 는 storage 오프셋이다.
 */
export function findManuscriptMatches(
  content: string,
  query: string,
  mode: ManuscriptSearchMode = "sentence",
): ManuscriptSearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed || !content) return [];

  const map = stripManuscriptMarkupWithMap(content);
  const visible = map.visible;
  if (!visible) return [];

  const rawMatches =
    mode === "word"
      ? findWordMatches(visible, trimmed)
      : findSentenceMatches(visible, trimmed);

  return rawMatches.map((match) => ({
    ...match,
    start: map.toStorageOffset(match.start),
    end: map.toStorageOffset(match.end),
    // 미리뷰도 마커 없는 텍스트 기준
    preview: match.preview,
  }));
}
