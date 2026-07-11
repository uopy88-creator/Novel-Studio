/**
 * =============================================================================
 * Scene 파서 / 직렬화
 * -----------------------------------------------------------------------------
 * Manuscript content(문자열) ↔ Scene[] 변환.
 * DB에는 Scene 테이블을 두지 않고, 원고 본문만 저장한다.
 *
 * 마커(`#1 제목`)는 프로그램이 자동으로 기록·재번호한다.
 * 사용자 UI에서는 번호를 `1.` 형태로만 보여 주며, 마커 입력을 요구하지 않는다.
 *
 * 안정 ID(`scene_001`)는 마커 줄 끝의 `·ns:scene_001` 태그로 보존한다.
 * Navigator 제목·Export 헤더에서는 이 태그를 제거한다.
 * =============================================================================
 */

import type { Scene, SceneDelimiterConfig } from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import { buildSceneMarkerRegex } from "@/features/manuscript/lib/scene-delimiter-settings";
import {
  ensureStableSceneId,
  formatStableSceneId,
} from "@/features/manuscript/lib/scene-ids";
import { countCharsWithoutSpaces } from "@/lib/stats";

/** 마커 줄에 붙는 안정 ID 태그 (사용자에게 의미 없는 내부용) */
const STABLE_ID_TAG_RE = /\s*·ns:(scene_\d+)\s*$/;

/** 제목 문자열에서 안정 ID 태그를 분리한다. */
export function splitTitleAndStableId(rawTitle: string): {
  title: string;
  stableId?: string;
} {
  const match = STABLE_ID_TAG_RE.exec(rawTitle);
  if (!match) {
    return { title: rawTitle.trim() };
  }
  return {
    title: rawTitle.slice(0, match.index).trim(),
    stableId: match[1],
  };
}

/** 직렬화용: 제목 + 안정 ID 태그 */
function formatMarkerTitle(title: string, stableId: string): string {
  const clean = title.trim();
  const tag = `·ns:${stableId}`;
  return clean ? `${clean} ${tag}` : tag;
}

/**
 * 원고 문자열을 Scene 목록으로 파싱한다.
 *
 * - 마커가 없으면 전체를 Scene 1개로 본다 (마커 없는 implicit scene).
 * - 마커 앞의 텍스트가 있으면 prologue 로 앞에 붙인 뒤 번호를 다시 매긴다.
 * - 안정 ID 태그가 없으면 순서 기반 scene_NNN 을 부여한다.
 */
export function parseScenes(
  content: string,
  config: SceneDelimiterConfig = DEFAULT_SCENE_DELIMITER,
): Scene[] {
  const text = content ?? "";
  const markerRe = buildSceneMarkerRegex(config);
  const lines = text.split("\n");

  type Draft = {
    number: number;
    title: string;
    stableId?: string;
    bodyLines: string[];
    startOffset: number;
  };

  const drafts: Draft[] = [];
  let offset = 0;
  let current: Draft | null = null;
  let prologueLines: string[] = [];
  let prologueStart = 0;
  let sawMarker = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineStart = offset;
    const match = markerRe.exec(line);

    if (match) {
      sawMarker = true;
      if (current) {
        drafts.push(current);
      } else if (prologueLines.length > 0) {
        drafts.push({
          number: 0,
          title: "",
          bodyLines: prologueLines,
          startOffset: prologueStart,
        });
        prologueLines = [];
      }

      const rawTitle = (match[2] ?? "").trim();
      const { title, stableId } = splitTitleAndStableId(rawTitle);

      current = {
        number: Number(match[1]) || drafts.length + 1,
        title,
        stableId,
        bodyLines: [],
        startOffset: lineStart,
      };
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      if (prologueLines.length === 0) prologueStart = lineStart;
      prologueLines.push(line);
    }

    offset += line.length + (i < lines.length - 1 ? 1 : 0);
  }

  if (current) {
    drafts.push(current);
  } else if (!sawMarker) {
    drafts.push({
      number: 1,
      title: "",
      bodyLines: prologueLines,
      startOffset: 0,
    });
  } else if (prologueLines.length > 0) {
    drafts.unshift({
      number: 0,
      title: "",
      bodyLines: prologueLines,
      startOffset: prologueStart,
    });
  }

  // 중복·누락 없이 안정 ID 할당 (태그 우선, 없으면 순서)
  const used = new Set<string>();
  const scenes: Scene[] = drafts.map((draft, index) => {
    const body = draft.bodyLines
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    const number = index + 1;
    const endOffset =
      index + 1 < drafts.length
        ? drafts[index + 1].startOffset
        : text.length;

    let id = ensureStableSceneId(draft.stableId, number);
    if (used.has(id)) {
      id = formatStableSceneId(number);
      let n = number;
      while (used.has(id)) {
        n += 1;
        id = formatStableSceneId(n);
      }
    }
    used.add(id);

    return {
      id,
      number,
      title: draft.title,
      body,
      startOffset: draft.startOffset,
      endOffset,
      charCount: countCharsWithoutSpaces(body),
      status: "draft" as const,
      memo: "",
    };
  });

  return scenes;
}

/**
 * Scene 목록을 원고 문자열로 다시 합친다.
 * 번호는 배열 순서대로 1, 2, 3… 으로 다시 매기고, 안정 ID 태그를 붙인다.
 */
export function serializeScenes(
  scenes: Scene[],
  config: SceneDelimiterConfig = DEFAULT_SCENE_DELIMITER,
): string {
  if (scenes.length === 0) return "";

  // Scene 이 하나이고 제목이 비어 있으면 마커 없이 본문만 (기존 원고 호환)
  if (scenes.length === 1 && !scenes[0].title.trim()) {
    return scenes[0].body;
  }

  return scenes
    .map((scene, index) => {
      const number = index + 1;
      const stableId = ensureStableSceneId(scene.id, number);
      const header = `${config.prefix}${number} ${formatMarkerTitle(scene.title, stableId)}`;
      const body = scene.body.replace(/^\n+/, "").replace(/\n+$/, "");
      return body ? `${header}\n${body}` : header;
    })
    .join("\n\n");
}

/** 스크롤용: Scene 시작 오프셋 (직렬화 후 재계산할 때 사용) */
export function findSceneStartOffset(
  content: string,
  sceneIndex: number,
  config: SceneDelimiterConfig = DEFAULT_SCENE_DELIMITER,
): number {
  const scenes = parseScenes(content, config);
  return scenes[sceneIndex]?.startOffset ?? 0;
}
