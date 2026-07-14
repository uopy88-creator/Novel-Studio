/**
 * =============================================================================
 * Manuscript sky-blue Highlight (단일 색)
 * -----------------------------------------------------------------------------
 * 저장: <mark data-ns-hl="sky" ...>text</mark>
 * 편집/오프셋/워드카운트: mark 를 제거한 plain text 기준
 * 표시: textarea(plain) + 배경 rect (본문 HTML 복제 없음)
 * =============================================================================
 */

export const SKY_HIGHLIGHT_COLOR = "#BFE8FF";

/** 저장·직렬화에 쓰는 mark 열기 태그 */
export const SKY_HIGHLIGHT_OPEN =
  '<mark data-ns-hl="sky" style="background-color:#BFE8FF">';

export const SKY_HIGHLIGHT_CLOSE = "</mark>";

/**
 * sky highlight mark 전체 매칭.
 * 속성 순서가 달라도 data-ns-hl="sky" 가 있으면 인식한다.
 */
const SKY_MARK_RE =
  /<mark\b(?=[^>]*\bdata-ns-hl\s*=\s*["']sky["'])[^>]*>([\s\S]*?)<\/mark>/gi;

/** 깨진/비-sky mark 잔여물 */
const ANY_MARK_OPEN_RE = /<mark\b[^>]*>/gi;
const ANY_MARK_CLOSE_RE = /<\/mark>/gi;

export interface HighlightRange {
  start: number;
  end: number;
}

export interface HighlightExtraction {
  plain: string;
  ranges: HighlightRange[];
}

function stripResidualMarkTags(text: string): string {
  return text.replace(ANY_MARK_OPEN_RE, "").replace(ANY_MARK_CLOSE_RE, "");
}

function hasMarkDebris(text: string): boolean {
  return /<\/?mark\b/i.test(text);
}

/** mark 태그를 제거한 plain text (워드카운트·파서·오프셋용) */
export function stripHighlights(content: string): string {
  return extractHighlights(content).plain;
}

/**
 * content → plain + plain 좌표 ranges.
 * 깨진 mark 가 남아 plain 에 태그가 보이면 태그를 제거하고 highlight 는 버린다
 * (에디터에 HTML 문자열이 그대로 보이며 “구멍/빈칸”처럼 보이는 것 방지).
 */
export function extractHighlights(content: string): HighlightExtraction {
  const text = content ?? "";
  if (!text.includes("<mark") && !text.includes("data-ns-hl")) {
    return { plain: text, ranges: [] };
  }

  const ranges: HighlightRange[] = [];
  let plain = "";
  let lastIndex = 0;

  SKY_MARK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SKY_MARK_RE.exec(text)) !== null) {
    plain += text.slice(lastIndex, match.index);
    const inner = match[1] ?? "";
    const start = plain.length;
    plain += inner;
    const end = plain.length;
    if (end > start) {
      ranges.push({ start, end });
    }
    lastIndex = match.index + match[0].length;
  }
  plain += text.slice(lastIndex);

  // 파싱 실패·비정상 mark 잔여물이 plain 에 남으면 표시용으로 위험
  if (hasMarkDebris(plain)) {
    return { plain: stripResidualMarkTags(plain), ranges: [] };
  }

  return { plain, ranges: mergeRanges(ranges) };
}

/**
 * 저장된 원고의 highlight mark 를 정규화한다.
 * - 유효 sky mark → 재직렬화
 * - 깨진 mark → plain 만 남김
 */
export function normalizeHighlightContent(content: string): string {
  const { plain, ranges } = extractHighlights(content ?? "");
  if (ranges.length === 0) return plain;
  return serializeHighlights(plain, ranges);
}

/** plain + ranges → mark 가 삽입된 저장 문자열 */
export function serializeHighlights(
  plain: string,
  ranges: HighlightRange[],
): string {
  const merged = mergeRanges(
    ranges.filter((r) => r.end > r.start && r.start >= 0),
  );
  if (merged.length === 0) return plain;

  let out = "";
  let cursor = 0;
  for (const range of merged) {
    const start = Math.min(range.start, plain.length);
    const end = Math.min(range.end, plain.length);
    if (end <= start || start < cursor) continue;
    out += plain.slice(cursor, start);
    out += SKY_HIGHLIGHT_OPEN;
    out += plain.slice(start, end);
    out += SKY_HIGHLIGHT_CLOSE;
    cursor = end;
  }
  out += plain.slice(cursor);
  return out;
}

function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: HighlightRange[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = sorted[i];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

function isFullyCovered(
  ranges: HighlightRange[],
  start: number,
  end: number,
): boolean {
  if (end <= start) return false;
  let cursor = start;
  const covering = ranges
    .filter((r) => r.end > start && r.start < end)
    .sort((a, b) => a.start - b.start);
  for (const r of covering) {
    if (r.start > cursor) return false;
    cursor = Math.max(cursor, r.end);
    if (cursor >= end) return true;
  }
  return cursor >= end;
}

function subtractRange(
  ranges: HighlightRange[],
  start: number,
  end: number,
): HighlightRange[] {
  const next: HighlightRange[] = [];
  for (const r of ranges) {
    if (r.end <= start || r.start >= end) {
      next.push(r);
      continue;
    }
    if (r.start < start) {
      next.push({ start: r.start, end: start });
    }
    if (r.end > end) {
      next.push({ start: end, end: r.end });
    }
  }
  return mergeRanges(next);
}

/** Selection(plain 좌표)에 대해 Highlight 토글 */
export function toggleHighlightInContent(
  content: string,
  start: number,
  end: number,
): string {
  const { plain, ranges } = extractHighlights(content);
  const s = Math.max(0, Math.min(start, end));
  const e = Math.min(plain.length, Math.max(start, end));
  if (e <= s) return content;

  const nextRanges = isFullyCovered(ranges, s, e)
    ? subtractRange(ranges, s, e)
    : mergeRanges([...ranges, { start: s, end: e }]);

  return serializeHighlights(plain, nextRanges);
}

/**
 * textarea 편집 후 ranges 재배치.
 * 변경 구간에 걸친 highlight 는 제거하고, 이후 구간은 delta 만큼 이동.
 */
export function remapHighlightRanges(
  oldPlain: string,
  newPlain: string,
  ranges: HighlightRange[],
): HighlightRange[] {
  if (oldPlain === newPlain) return ranges;

  let prefix = 0;
  const minLen = Math.min(oldPlain.length, newPlain.length);
  while (
    prefix < minLen &&
    oldPlain.charCodeAt(prefix) === newPlain.charCodeAt(prefix)
  ) {
    prefix += 1;
  }

  let oldSuffix = oldPlain.length;
  let newSuffix = newPlain.length;
  while (
    oldSuffix > prefix &&
    newSuffix > prefix &&
    oldPlain.charCodeAt(oldSuffix - 1) === newPlain.charCodeAt(newSuffix - 1)
  ) {
    oldSuffix -= 1;
    newSuffix -= 1;
  }

  const delta = newSuffix - oldSuffix;

  return mergeRanges(
    ranges.flatMap((r) => {
      if (r.end <= prefix) return [r];
      if (r.start >= oldSuffix) {
        return [{ start: r.start + delta, end: r.end + delta }];
      }
      // 편집 구간과 겹치면 제거 (안전하게)
      return [];
    }),
  );
}

/** plain 편집 결과를 mark 포함 content 로 합친다 */
export function applyPlainEditToHighlightedContent(
  previousContent: string,
  nextPlain: string,
): string {
  // Highlight 없으면 정규화 비용 없이 그대로 반환
  // (단, 깨진 mark 잔여물은 제거)
  if (
    !previousContent.includes("data-ns-hl") &&
    !previousContent.includes("<mark")
  ) {
    return nextPlain;
  }
  const { plain: oldPlain, ranges } = extractHighlights(previousContent);
  const nextRanges = remapHighlightRanges(oldPlain, nextPlain, ranges);
  return serializeHighlights(nextPlain, nextRanges);
}
