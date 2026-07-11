/**
 * =============================================================================
 * Chapter 블록 (원고 안 구분선)
 * -----------------------------------------------------------------------------
 * Manuscript 는 프로젝트 전체 원고 하나.
 * Chapter 는 ===== 구분선으로만 나뉜다. (Scene `#N` 과 별개)
 *
 * 형식:
 *   ================
 *   ⟦ns:chapter:{id}⟧ 제목
 *   ================
 *   (본문)
 *
 * 저장은 여전히 Document별 manuscript 행 (기존 데이터 유지).
 * 편집 UI 에서만 이어 붙여 보여 준다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ChapterId } from "@/types/ids";

const RULE = "================";
const ID_LINE_RE = /^⟦ns:chapter:([^|\]]+)(?:\|(.*))?⟧\s*(.*)$/;

export interface ChapterBlock {
  chapterId: ChapterId;
  title: string;
  body: string;
  /** 통합 원고에서 블록 시작 오프셋 (구분선 포함) */
  startOffset: number;
  /** 본문만의 시작 오프셋 */
  bodyStartOffset: number;
  endOffset: number;
}

function escapeTitle(title: string): string {
  return title.replace(/\r?\n/g, " ").trim();
}

/** 구분 헤더 한 블록 */
export function formatChapterHeader(chapterId: ChapterId, title: string): string {
  const clean = escapeTitle(title) || "제목 없음";
  return `${RULE}\n⟦ns:chapter:${chapterId}⟧ ${clean}\n${RULE}`;
}

/**
 * Document 목록 + 본문 맵 → 하나의 긴 원고
 */
export function joinChapterBodies(
  chapters: Chapter[],
  bodies: Map<ChapterId, string>,
): string {
  if (chapters.length === 0) return "";

  return chapters
    .map((chapter) => {
      const header = formatChapterHeader(chapter.id, chapter.title);
      const body = (bodies.get(chapter.id) ?? "").replace(/^\n+/, "").replace(/\n+$/, "");
      return body ? `${header}\n${body}` : header;
    })
    .join("\n\n");
}

/**
 * 통합 원고 → Chapter별 본문.
 * chapters 순서(또는 마커 ID)로 매칭한다.
 */
export function splitChapterBodies(
  content: string,
  chapters: Chapter[],
): Map<ChapterId, string> {
  const result = new Map<ChapterId, string>();
  for (const chapter of chapters) {
    result.set(chapter.id, "");
  }
  if (!content.trim() || chapters.length === 0) return result;

  const lines = content.split("\n");
  type Draft = { chapterId: ChapterId; bodyLines: string[] };
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // 구분선 시작 감지
    if (line.trim() === RULE && i + 2 < lines.length && lines[i + 2].trim() === RULE) {
      const mid = lines[i + 1];
      const match = ID_LINE_RE.exec(mid.trim());
      let chapterId: ChapterId | null = null;
      if (match) {
        chapterId = match[1] as ChapterId;
      } else {
        // 레거시/수동 제목만 있는 경우 — 순서대로 할당
        const nextIndex = drafts.length;
        chapterId = chapters[nextIndex]?.id ?? null;
      }

      if (current) drafts.push(current);
      if (chapterId) {
        current = { chapterId, bodyLines: [] };
      } else {
        current = null;
      }
      i += 3;
      // 헤더 직후 빈 줄 하나 건너뛰기(선택)
      if (i < lines.length && lines[i] === "") i += 1;
      continue;
    }

    if (current) {
      current.bodyLines.push(line);
    } else if (chapters.length === 1 && drafts.length === 0) {
      // 마커 없는 단일 챕터 원고 호환
      current = { chapterId: chapters[0].id, bodyLines: [line] };
    }
    i += 1;
  }
  if (current) drafts.push(current);

  // 마커 없이 통짜 본문만 있는 경우
  if (drafts.length === 0 && chapters.length > 0) {
    result.set(chapters[0].id, content.replace(/^\n+/, "").replace(/\n+$/, ""));
    return result;
  }

  for (const draft of drafts) {
    if (!result.has(draft.chapterId)) continue;
    const body = draft.bodyLines
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    result.set(draft.chapterId, body);
  }

  return result;
}

/** 통합 원고에서 Chapter 블록 메타(오프셋) 계산 */
export function parseChapterBlocks(
  content: string,
  chapters: Chapter[],
): ChapterBlock[] {
  if (chapters.length === 0) return [];

  const bodies = splitChapterBodies(content, chapters);
  // join 결과와 동일한 레이아웃으로 오프셋 재계산
  const rebuilt = joinChapterBodies(chapters, bodies);
  const text = content.includes("⟦ns:chapter:") ? content : rebuilt;

  const blocks: ChapterBlock[] = [];
  let searchFrom = 0;

  for (const chapter of chapters) {
    const header = formatChapterHeader(chapter.id, chapter.title);
    let start = text.indexOf(header, searchFrom);
    // 제목이 바뀌었을 수 있음 — id 마커로 찾기
    if (start < 0) {
      const needle = `⟦ns:chapter:${chapter.id}⟧`;
      const idAt = text.indexOf(needle, searchFrom);
      if (idAt >= 0) {
        // 위로 RULE 줄 찾기
        const before = text.lastIndexOf(`\n${RULE}\n`, idAt);
        start = before >= 0 ? before + 1 : Math.max(0, idAt - RULE.length - 1);
        // 파일 시작 RULE
        if (text.startsWith(RULE) && text.indexOf(needle) === idAt) {
          const alt = text.indexOf(RULE);
          if (alt >= 0 && alt < idAt) start = alt;
        }
      }
    }

    if (start < 0) {
      // 폴백: 이전 블록 끝
      const prevEnd = blocks.length > 0 ? blocks[blocks.length - 1].endOffset : 0;
      const body = bodies.get(chapter.id) ?? "";
      blocks.push({
        chapterId: chapter.id,
        title: chapter.title,
        body,
        startOffset: prevEnd,
        bodyStartOffset: prevEnd,
        endOffset: prevEnd + body.length,
      });
      searchFrom = prevEnd;
      continue;
    }

    const headerEnd = start + header.length;
    const bodyStart =
      text[headerEnd] === "\n" ? headerEnd + 1 : headerEnd;
    const nextHeaderNeedle = "\n" + RULE + "\n⟦ns:chapter:";
    const nextAt = text.indexOf(nextHeaderNeedle, bodyStart);
    // 다음 챕터 구분: \n\n================ 또는 \n================
    let end: number;
    if (nextAt >= 0) {
      end = nextAt;
      // trim trailing newlines that are separators between blocks
      while (end > bodyStart && text[end - 1] === "\n") {
        // keep one structure — body shouldn't include trailing blank used as join
        if (text.slice(end - 2, end) === "\n\n") {
          end -= 2;
          break;
        }
        end -= 1;
      }
    } else {
      end = text.length;
    }

    const body = text.slice(bodyStart, end).replace(/^\n+/, "").replace(/\n+$/, "");
    blocks.push({
      chapterId: chapter.id,
      title: chapter.title,
      body: bodies.get(chapter.id) ?? body,
      startOffset: start,
      bodyStartOffset: bodyStart,
      endOffset: end,
    });
    searchFrom = end;
  }

  return blocks;
}

/** 특정 Chapter 본문만 교체한 통합 원고 */
export function replaceChapterBodyInContent(
  content: string,
  chapters: Chapter[],
  chapterId: ChapterId,
  nextBody: string,
): string {
  const bodies = splitChapterBodies(content, chapters);
  bodies.set(chapterId, nextBody);
  return joinChapterBodies(chapters, bodies);
}

/** 전역 오프셋 → (chapterId, 로컬 오프셋) */
export function globalOffsetToChapterLocal(
  content: string,
  chapters: Chapter[],
  globalOffset: number,
): { chapterId: ChapterId; localOffset: number } | null {
  const blocks = parseChapterBlocks(content, chapters);
  for (const block of blocks) {
    if (globalOffset >= block.startOffset && globalOffset <= block.endOffset) {
      const local = Math.max(0, globalOffset - block.bodyStartOffset);
      return { chapterId: block.chapterId, localOffset: local };
    }
  }
  if (blocks.length > 0) {
    const last = blocks[blocks.length - 1];
    return {
      chapterId: last.chapterId,
      localOffset: Math.max(0, last.body.length),
    };
  }
  return null;
}

/** 로컬 오프셋 → 전역 */
export function chapterLocalToGlobalOffset(
  content: string,
  chapters: Chapter[],
  chapterId: ChapterId,
  localOffset: number,
): number {
  const blocks = parseChapterBlocks(content, chapters);
  const block = blocks.find((b) => b.chapterId === chapterId);
  if (!block) return localOffset;
  return block.bodyStartOffset + localOffset;
}
