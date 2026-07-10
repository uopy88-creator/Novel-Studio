/**
 * =============================================================================
 * 원고 내 검색
 * -----------------------------------------------------------------------------
 * plain text 기준으로 대소문자 구분 없이 모든 출현 위치를 찾는다.
 * =============================================================================
 */

export interface ManuscriptSearchMatch {
  /** 결과 목록용 순번 (1부터) */
  index: number;
  /** content 안 시작 오프셋 */
  start: number;
  /** content 안 끝 오프셋 (미포함) */
  end: number;
  /** 주변 문맥 미리보기 */
  preview: string;
}

const PREVIEW_RADIUS = 28;

/**
 * query가 비어 있으면 빈 배열.
 * 겹치지 않는 순차 매치를 모두 반환한다.
 */
export function findManuscriptMatches(
  content: string,
  query: string,
): ManuscriptSearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed || !content) return [];

  const haystack = content.toLowerCase();
  const needle = trimmed.toLowerCase();
  const matches: ManuscriptSearchMatch[] = [];
  let from = 0;
  let index = 1;

  while (from <= haystack.length) {
    const found = haystack.indexOf(needle, from);
    if (found < 0) break;

    const start = found;
    const end = found + needle.length;
    const previewStart = Math.max(0, start - PREVIEW_RADIUS);
    const previewEnd = Math.min(content.length, end + PREVIEW_RADIUS);
    const slice = content.slice(previewStart, previewEnd);

    matches.push({
      index,
      start,
      end,
      preview:
        (previewStart > 0 ? "…" : "") +
        slice +
        (previewEnd < content.length ? "…" : ""),
    });

    index += 1;
    from = end;
  }

  return matches;
}
