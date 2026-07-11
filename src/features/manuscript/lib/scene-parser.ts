/**
 * =============================================================================
 * Scene 파서 / 직렬화
 * -----------------------------------------------------------------------------
 * Manuscript content(문자열) ↔ Scene[] 변환.
 * DB에는 Scene 테이블을 두지 않고, 원고 본문만 저장한다.
 * =============================================================================
 */

import type { Scene, SceneDelimiterConfig } from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import { buildSceneMarkerRegex } from "@/features/manuscript/lib/scene-delimiter-settings";
import { countCharsWithoutSpaces } from "@/lib/stats";

function makeSceneId(number: number, title: string, body: string): string {
  // 번호·제목·본문 앞부분을 섞어 비교적 안정적인 키를 만든다
  const tip = body.slice(0, 24).replace(/\s+/g, " ");
  return `scene-${number}-${title}-${tip}`.slice(0, 80);
}

/**
 * 원고 문자열을 Scene 목록으로 파싱한다.
 *
 * - 마커가 없으면 전체를 Scene 1개로 본다 (마커 없는 implicit scene).
 * - 마커 앞의 텍스트가 있으면 번호 0번대 prologue 로 앞에 붙인다.
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
        // 첫 마커 이전 텍스트 → Scene 0 (나중에 번호 재부여)
        drafts.push({
          number: 0,
          title: "",
          bodyLines: prologueLines,
          startOffset: prologueStart,
        });
        prologueLines = [];
      }

      current = {
        number: Number(match[1]) || drafts.length + 1,
        title: (match[2] ?? "").trim(),
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
    // 마커 없음 → 전체 한 Scene
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

    return {
      id: makeSceneId(number, draft.title, body),
      number,
      title: draft.title,
      body,
      startOffset: draft.startOffset,
      endOffset,
      charCount: countCharsWithoutSpaces(body),
      status: "draft",
      memo: "",
    };
  });

  return scenes;
}

/**
 * Scene 목록을 원고 문자열로 다시 합친다.
 * 번호는 배열 순서대로 1, 2, 3… 으로 다시 매긴다.
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
      const title = scene.title.trim();
      const header = title
        ? `${config.prefix}${number} ${title}`
        : `${config.prefix}${number}`;
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
