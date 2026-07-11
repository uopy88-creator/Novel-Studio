/**
 * =============================================================================
 * 문장 단위 버전 비교
 * -----------------------------------------------------------------------------
 * 추가 / 삭제 / 수정된 문장을 표시한다.
 * =============================================================================
 */

export type DiffKind = "equal" | "added" | "deleted" | "modified";

export interface DiffSentence {
  kind: DiffKind;
  /** 이전 버전 문장 (deleted / modified / equal) */
  before?: string;
  /** 이후 버전 문장 (added / modified / equal) */
  after?: string;
}

export interface VersionDiffResult {
  sentences: DiffSentence[];
  addedCount: number;
  deletedCount: number;
  modifiedCount: number;
}

/** 문장 분리 — 종결부호·줄바꿈 기준 */
export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks = normalized.split(/(?<=[.!?。！？…])(?:\s+|$)|(?:\n+)/);
  return chunks.map((s) => s.trim()).filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/** 0~1 유사도 (1 = 동일) */
export function sentenceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = Math.max(a.length, b.length);
  if (longer === 0) return 1;
  return 1 - levenshtein(a, b) / longer;
}

type RawOp =
  | { type: "equal"; text: string }
  | { type: "delete"; text: string }
  | { type: "insert"; text: string };

/** LCS 기반 문장 diff */
function lcsDiff(before: string[], after: string[]): RawOp[] {
  const m = before.length;
  const n = after.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (before[i] === after[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: RawOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (before[i] === after[j]) {
      ops.push({ type: "equal", text: before[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", text: before[i] });
      i++;
    } else {
      ops.push({ type: "insert", text: after[j] });
      j++;
    }
  }
  while (i < m) {
    ops.push({ type: "delete", text: before[i++] });
  }
  while (j < n) {
    ops.push({ type: "insert", text: after[j++] });
  }
  return ops;
}

const MODIFY_THRESHOLD = 0.45;

/**
 * before → after 문장 비교.
 * 인접한 삭제+추가가 비슷하면 "수정"으로 묶는다.
 */
export function diffSentences(
  beforeText: string,
  afterText: string,
): VersionDiffResult {
  const before = splitSentences(beforeText);
  const after = splitSentences(afterText);
  const ops = lcsDiff(before, after);

  const sentences: DiffSentence[] = [];
  let addedCount = 0;
  let deletedCount = 0;
  let modifiedCount = 0;

  let index = 0;
  while (index < ops.length) {
    const op = ops[index];
    const next = ops[index + 1];

    if (
      op.type === "delete" &&
      next?.type === "insert" &&
      sentenceSimilarity(op.text, next.text) >= MODIFY_THRESHOLD
    ) {
      sentences.push({
        kind: "modified",
        before: op.text,
        after: next.text,
      });
      modifiedCount++;
      index += 2;
      continue;
    }

    if (op.type === "equal") {
      sentences.push({ kind: "equal", before: op.text, after: op.text });
    } else if (op.type === "delete") {
      sentences.push({ kind: "deleted", before: op.text });
      deletedCount++;
    } else {
      sentences.push({ kind: "added", after: op.text });
      addedCount++;
    }
    index++;
  }

  return { sentences, addedCount, deletedCount, modifiedCount };
}
