/**
 * =============================================================================
 * Manuscript inline markup — 텍스트 색상 (집필용 표시)
 * -----------------------------------------------------------------------------
 * 장식이 아니라 「필요한 부분을 표시」하기 위한 인라인 마커.
 *
 * 문법 (본문에 저장 · Supabase 동기화)
 *   ·ns:fg:b·파란 글자·ns:/fg·
 *   ·ns:fg:r·빨간 글자·ns:/fg·
 *   ·ns:fg:y·노란 글자·ns:/fg·
 *   검정(기본) = 마커 없음 (또는 적용 시 마커 제거)
 *
 * 향후 하이라이트는 별도 네임스페이스로 확장한다.
 *   ·ns:bg:y·배경·ns:/bg·   ← 아직 미사용, fg 와 충돌하지 않음
 *
 * 검색·통계·TXT 는 stripManuscriptMarkup() 결과를 사용한다.
 * =============================================================================
 */

/** 전경(글자) 색상 코드 — UI 4색 */
export type ManuscriptFgColor = "k" | "b" | "r" | "y";

export const MANUSCRIPT_FG_COLORS: readonly ManuscriptFgColor[] = [
  "k",
  "b",
  "r",
  "y",
] as const;

export const MANUSCRIPT_FG_LABELS: Record<ManuscriptFgColor, string> = {
  k: "검정",
  b: "파랑",
  r: "빨강",
  y: "노랑",
};

/** CSS / 오버레이용 */
export const MANUSCRIPT_FG_CSS: Record<ManuscriptFgColor, string> = {
  k: "#111827", // ns-ink 근사
  b: "#2563eb", // ns-accent
  r: "#dc2626",
  y: "#ca8a04", // 흰 배경에서 읽히는 노랑
};

/** DOCX hex (without #) */
export const MANUSCRIPT_FG_DOCX: Record<ManuscriptFgColor, string> = {
  k: "111827",
  b: "2563EB",
  r: "DC2626",
  y: "CA8A04",
};

/** PDF RGB 0–255 */
export const MANUSCRIPT_FG_PDF: Record<ManuscriptFgColor, [number, number, number]> =
  {
    k: [17, 24, 39],
    b: [37, 99, 235],
    r: [220, 38, 38],
    y: [202, 138, 4],
  };

const OPEN_RE = /·ns:fg:([kbry])·/g;
const CLOSE_TOKEN = "·ns:/fg·";
const ANY_MARKUP_RE = /·ns:fg:[kbry]·|·ns:\/fg·/g;

export interface ManuscriptTextRun {
  text: string;
  color: ManuscriptFgColor;
}

export interface StripMarkupMap {
  /** 마커가 제거된 순수 텍스트 */
  visible: string;
  /** visible 오프셋 → storage(content) 오프셋 */
  toStorageOffset: (visibleOffset: number) => number;
  /** storage 오프셋 → visible 오프셋 */
  toVisibleOffset: (storageOffset: number) => number;
}

function isFgColor(value: string): value is ManuscriptFgColor {
  return value === "k" || value === "b" || value === "r" || value === "y";
}

/** 본문에서 색상 마커를 모두 제거한 순수 텍스트 */
export function stripManuscriptMarkup(content: string): string {
  return (content ?? "").replace(ANY_MARKUP_RE, "");
}

/**
 * 마커 제거 + 오프셋 매핑 (검색·점프용).
 */
export function stripManuscriptMarkupWithMap(content: string): StripMarkupMap {
  const text = content ?? "";
  let visible = "";
  /** visibleIndex → storageIndex (visible 끝 = visible.length 용으로 +1) */
  const visToStore: number[] = [];
  /** storageIndex → visibleIndex */
  const storeToVis: number[] = new Array(text.length + 1).fill(0);

  let i = 0;
  let v = 0;
  while (i < text.length) {
    OPEN_RE.lastIndex = i;
    const open = OPEN_RE.exec(text);
    if (open && open.index === i) {
      const token = open[0];
      for (let t = 0; t < token.length; t += 1) {
        storeToVis[i + t] = v;
      }
      i += token.length;
      continue;
    }
    if (text.startsWith(CLOSE_TOKEN, i)) {
      for (let t = 0; t < CLOSE_TOKEN.length; t += 1) {
        storeToVis[i + t] = v;
      }
      i += CLOSE_TOKEN.length;
      continue;
    }
    visToStore[v] = i;
    storeToVis[i] = v;
    visible += text[i];
    i += 1;
    v += 1;
  }
  visToStore[v] = text.length;
  storeToVis[text.length] = v;

  return {
    visible,
    toStorageOffset: (visibleOffset: number) => {
      const clamped = Math.max(0, Math.min(visibleOffset, visToStore.length - 1));
      return visToStore[clamped] ?? text.length;
    },
    toVisibleOffset: (storageOffset: number) => {
      const clamped = Math.max(0, Math.min(storageOffset, storeToVis.length - 1));
      return storeToVis[clamped] ?? visible.length;
    },
  };
}

/**
 * 저장 문자열 → 색상 run 목록 (오버레이 · DOCX · PDF).
 * 잘못된/미닫힘 마커는 무시하고 텍스트로 취급하지 않고 건너뛴다.
 */
export function parseManuscriptColorRuns(
  content: string,
): ManuscriptTextRun[] {
  const text = content ?? "";
  const runs: ManuscriptTextRun[] = [];
  let color: ManuscriptFgColor = "k";
  let i = 0;
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    runs.push({ text: buffer, color });
    buffer = "";
  };

  while (i < text.length) {
    OPEN_RE.lastIndex = i;
    const open = OPEN_RE.exec(text);
    if (open && open.index === i) {
      flush();
      const code = open[1];
      color = isFgColor(code) ? code : "k";
      i += open[0].length;
      continue;
    }
    if (text.startsWith(CLOSE_TOKEN, i)) {
      flush();
      color = "k";
      i += CLOSE_TOKEN.length;
      continue;
    }
    buffer += text[i];
    i += 1;
  }
  flush();
  return runs;
}

/**
 * selection 구간에 색상 적용.
 * - 구간 안 기존 fg 마커는 제거하고 다시 감싼다.
 * - 검정(k)이면 마커 없이 순수 텍스트만 남긴다.
 */
export function applyManuscriptFgColor(
  content: string,
  start: number,
  end: number,
  color: ManuscriptFgColor,
): string {
  const text = content ?? "";
  if (start === end || start < 0 || end > text.length || start > end) {
    return text;
  }

  // 부분 마커 걸리면 마커 전체로 확장
  const expanded = expandToMarkupBoundaries(text, start, end);
  const before = text.slice(0, expanded.start);
  const middle = text.slice(expanded.start, expanded.end);
  const after = text.slice(expanded.end);

  const plainMiddle = stripManuscriptMarkup(middle);
  if (!plainMiddle) {
    return before + after;
  }

  if (color === "k") {
    return normalizeManuscriptMarkup(before + plainMiddle + after);
  }

  const open = `·ns:fg:${color}·`;
  return normalizeManuscriptMarkup(
    before + open + plainMiddle + CLOSE_TOKEN + after,
  );
}

/** 선택 구간이 색상 스팬 안이면 open/close 마커까지 포함하도록 확장 */
function expandToMarkupBoundaries(
  text: string,
  start: number,
  end: number,
): { start: number; end: number } {
  let s = start;
  let e = end;

  // 1) 선택 경계가 토큰 중간이면 토큰 전체로
  const openMatches = [...text.matchAll(/·ns:fg:[kbry]·/g)];
  for (const m of openMatches) {
    const a = m.index ?? 0;
    const b = a + m[0].length;
    if (s > a && s < b) s = a;
    if (e > a && e < b) e = b;
  }
  let closeIdx = text.indexOf(CLOSE_TOKEN);
  while (closeIdx >= 0) {
    const b = closeIdx + CLOSE_TOKEN.length;
    if (s > closeIdx && s < b) s = closeIdx;
    if (e > closeIdx && e < b) e = b;
    closeIdx = text.indexOf(CLOSE_TOKEN, closeIdx + 1);
  }

  // 2) 선택 시작이 열린 색상 스팬 안이면 해당 open 까지 포함
  const before = text.slice(0, s);
  const opensBefore = [...before.matchAll(/·ns:fg:[kbry]·/g)];
  const closesBefore = [...before.matchAll(/·ns:\/fg·/g)];
  const lastOpen = opensBefore[opensBefore.length - 1];
  const lastClose = closesBefore[closesBefore.length - 1];
  const lastOpenAt = lastOpen?.index ?? -1;
  const lastCloseAt = lastClose?.index ?? -1;
  if (lastOpenAt > lastCloseAt) {
    s = lastOpenAt;
  }

  // 3) 구간에 open 이 close 보다 많으면 다음 close 까지 포함
  const slice = text.slice(s, e);
  const openCount = (slice.match(/·ns:fg:[kbry]·/g) ?? []).length;
  const closeCount = (slice.match(/·ns:\/fg·/g) ?? []).length;
  if (openCount > closeCount) {
    const nextClose = text.indexOf(CLOSE_TOKEN, e);
    if (nextClose >= 0) {
      e = nextClose + CLOSE_TOKEN.length;
    }
  }

  return { start: s, end: e };
}

/**
 * 줄 단위로 run 을 나눈다 (DOCX/PDF 단락용).
 * 각 줄은 ManuscriptTextRun[] 이며, 빈 줄은 [{ text: "", color: "k" }].
 */
export function splitColorRunsByLine(
  content: string,
): ManuscriptTextRun[][] {
  const runs = parseManuscriptColorRuns(content);
  const lines: ManuscriptTextRun[][] = [[]];

  for (const run of runs) {
    const parts = run.text.replace(/\r\n/g, "\n").split("\n");
    for (let i = 0; i < parts.length; i += 1) {
      if (i > 0) lines.push([]);
      if (parts[i].length > 0) {
        lines[lines.length - 1].push({ text: parts[i], color: run.color });
      }
    }
  }

  if (lines.length === 0) return [[{ text: "", color: "k" }]];
  return lines.map((line) =>
    line.length === 0 ? [{ text: "", color: "k" as const }] : line,
  );
}

/** 빈 색상 스팬 제거 + 인접 동일 색 병합 (저장 정규화) */
export function normalizeManuscriptMarkup(content: string): string {
  const runs = parseManuscriptColorRuns(content);
  let out = "";
  let buf = "";
  let color: ManuscriptFgColor = "k";

  const flush = () => {
    if (!buf) return;
    if (color === "k") {
      out += buf;
    } else {
      out += `·ns:fg:${color}·${buf}${CLOSE_TOKEN}`;
    }
    buf = "";
  };

  for (const run of runs) {
    if (!run.text) continue;
    if (run.color === color) {
      buf += run.text;
      continue;
    }
    flush();
    color = run.color;
    buf = run.text;
  }
  flush();
  return out;
}

/**
 * 에디터는 마커 없는 visible 문자열을 편집한다.
 * 변경분을 storage(마커 포함)에 반영한다.
 * 삽입된 글자는 커서 위치가 색상 구간 안이면 그 색을 유지한다.
 */
export function reconcileVisibleEdit(
  prevStorage: string,
  nextVisible: string,
): string {
  const map = stripManuscriptMarkupWithMap(prevStorage);
  const prevVisible = map.visible;
  if (prevVisible === nextVisible) return prevStorage;

  let prefix = 0;
  const minLen = Math.min(prevVisible.length, nextVisible.length);
  while (prefix < minLen && prevVisible[prefix] === nextVisible[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < prevVisible.length - prefix &&
    suffix < nextVisible.length - prefix &&
    prevVisible[prevVisible.length - 1 - suffix] ===
      nextVisible[nextVisible.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const storageStart = map.toStorageOffset(prefix);
  const storageEnd = map.toStorageOffset(prevVisible.length - suffix);
  const inserted = nextVisible.slice(prefix, nextVisible.length - suffix);

  const next =
    prevStorage.slice(0, storageStart) +
    inserted +
    prevStorage.slice(storageEnd);

  return normalizeManuscriptMarkup(next);
}

/**
 * storage 오프셋 구간의 통일 색상.
 * 구간이 비었거나 여러 색이 섞이면 null.
 */
export function getUniformManuscriptFgColor(
  content: string,
  start: number,
  end: number,
): ManuscriptFgColor | null {
  if (start >= end) return null;
  const slice = content.slice(start, end);
  const runs = parseManuscriptColorRuns(slice).filter((r) => r.text.length > 0);
  if (runs.length === 0) return "k";
  const first = runs[0].color;
  return runs.every((r) => r.color === first) ? first : null;
}
