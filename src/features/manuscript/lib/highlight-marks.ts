/**
 * =============================================================================
 * Manuscript sky-blue Highlight (단일 색)
 * -----------------------------------------------------------------------------
 * 저장: <mark data-ns-hl="sky" ...>text</mark>
 * 편집/오프셋/워드카운트: mark 를 제거한 plain text 기준
 * TipTap 없음 — textarea + 오버레이로 표시 (현재 Editor 구조 유지)
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

export interface HighlightRange {
  start: number;
  end: number;
}

export interface HighlightExtraction {
  plain: string;
  ranges: HighlightRange[];
}

/** mark 태그를 제거한 plain text (워드카운트·파서·오프셋용) */
export function stripHighlights(content: string): string {
  return extractHighlights(content).plain;
}

/** content → plain + plain 좌표 ranges */
export function extractHighlights(content: string): HighlightExtraction {
  const text = content ?? "";
  // 빠른 경로 — mark 없으면 정규식 전체를 돌리지 않는다
  if (!text.includes("data-ns-hl")) {
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

  return { plain, ranges: mergeRanges(ranges) };
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
  if (!previousContent.includes("data-ns-hl")) {
    return nextPlain;
  }
  const { plain: oldPlain, ranges } = extractHighlights(previousContent);
  const nextRanges = remapHighlightRanges(oldPlain, nextPlain, ranges);
  return serializeHighlights(nextPlain, nextRanges);
}

/** 오버레이용: plain 을 escape 하고 ranges 를 <mark> 로 감싼 HTML */
export function highlightsToOverlayHtml(
  plain: string,
  ranges: HighlightRange[],
): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const merged = mergeRanges(ranges);
  if (merged.length === 0) {
    return escape(plain);
  }

  let html = "";
  let cursor = 0;
  for (const range of merged) {
    const start = Math.min(range.start, plain.length);
    const end = Math.min(range.end, plain.length);
    if (end <= start || start < cursor) continue;
    html += escape(plain.slice(cursor, start));
    html += `<mark data-ns-hl="sky" style="background-color:${SKY_HIGHLIGHT_COLOR}">`;
    html += escape(plain.slice(start, end));
    html += "</mark>";
    cursor = end;
  }
  html += escape(plain.slice(cursor));
  return html;
}
