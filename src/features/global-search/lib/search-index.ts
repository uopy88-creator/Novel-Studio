/**
 * =============================================================================
 * SearchIndex
 * -----------------------------------------------------------------------------
 * 프로젝트 데이터를 검색 가능한 SearchDocument[] 로 정규화한다.
 * 새 도메인을 추가할 때는 이 파일에 수집 로직만 붙이면 된다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import type { SearchDocument } from "@/features/global-search/types/search";
import {
  characterSearchHref,
  foreshadowingSearchHref,
  inspirationSearchHref,
  manuscriptSearchHref,
  memoSearchHref,
  writingVaultSearchHref,
} from "@/features/global-search/lib/search-href";
import { readChaptersByProject } from "@/features/manuscript/lib/chapter-storage";
import { readAllManuscripts } from "@/features/manuscript/lib/manuscript-storage";
import { parseScenes } from "@/features/manuscript/lib/scene-parser";
import { findManuscriptMatches } from "@/features/manuscript/lib/search-manuscript";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { readMemosByProject } from "@/features/memo/lib/memo-storage";
import { readDialoguesByProject } from "@/features/dialogue-vault/lib/dialogue-storage";
import { readForeshadowingsByProject } from "@/features/foreshadowing/lib/foreshadowing-storage";
import { readInspirationsByProject } from "@/features/inspiration/lib/inspiration-storage";

const MAX_MATCHES_PER_DOCUMENT = 4;

function joinFields(...parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export interface BuildSearchIndexParams {
  projectId: ProjectId;
  projectName: string;
  /** Manuscript 본문 매치용 쿼리 (빈 값이면 본문 히트 생략) */
  query?: string;
}

/**
 * 프로젝트 전체 SearchDocument 인덱스를 만든다.
 * Manuscript 본문 매치는 query 가 있을 때만 생성한다 (성능).
 */
export async function buildSearchIndex(
  params: BuildSearchIndexParams,
): Promise<SearchDocument[]> {
  const { projectId, projectName, query = "" } = params;
  const trimmed = query.trim();

  const [
    chapters,
    manuscripts,
    characters,
    memos,
    vault,
    foreshadowings,
    inspirations,
  ] = await Promise.all([
    readChaptersByProject(projectId),
    readAllManuscripts(),
    readCharactersByProject(projectId),
    readMemosByProject(projectId),
    readDialoguesByProject(projectId),
    readForeshadowingsByProject(projectId),
    readInspirationsByProject(projectId),
  ]);

  const chapterTitle = new Map(
    chapters.map((c) => [c.id, c.title.trim() || "제목 없는 Chapter"]),
  );
  const projectManuscripts = manuscripts.filter(
    (m) => m.projectId === projectId,
  );

  const docs: SearchDocument[] = [];

  for (const manuscript of projectManuscripts) {
    const docTitle =
      chapterTitle.get(manuscript.chapterId) ?? "Chapter";
    const content = manuscript.content ?? manuscript.plainText ?? "";

    if (trimmed) {
      const matches = findManuscriptMatches(content, trimmed, "sentence").slice(
        0,
        MAX_MATCHES_PER_DOCUMENT,
      );
      for (const match of matches) {
        docs.push({
          id: `ms-${manuscript.chapterId}-${match.start}`,
          kind: "manuscript",
          title: docTitle,
          body: match.preview,
          projectId,
          projectName,
          href: manuscriptSearchHref(projectId, manuscript.chapterId, {
            offset: match.start,
            end: match.end,
          }),
        });
      }
    }

    const scenes = parseScenes(content);
    for (const scene of scenes) {
      const title = scene.title.trim()
        ? `#${scene.number} ${scene.title.trim()}`
        : `#${scene.number}`;
      docs.push({
        id: `sc-${manuscript.chapterId}-${scene.id}`,
        kind: "scene",
        title,
        body: joinFields(docTitle, scene.body?.slice(0, 200)),
        projectId,
        projectName,
        href: manuscriptSearchHref(projectId, manuscript.chapterId, {
          sceneId: scene.id,
          offset: scene.startOffset,
        }),
      });
    }
  }

  for (const character of characters) {
    docs.push({
      id: `ch-${character.id}`,
      kind: "character",
      title: character.name || "이름 없음",
      body: joinFields(
        character.role,
        character.occupation,
        character.personality,
        character.goal,
        character.secret,
        character.memo,
        character.age,
        character.gender,
      ),
      projectId,
      projectName,
      href: characterSearchHref(projectId, character.id),
    });
  }

  for (const memo of memos) {
    docs.push({
      id: `mm-${memo.id}`,
      kind: "memo",
      title: memo.body.trim().slice(0, 48) || "빈 메모",
      body: joinFields(memo.body, memo.kind, ...(memo.tags ?? [])),
      projectId,
      projectName,
      href: memoSearchHref(projectId, memo.id),
    });
  }

  for (const entry of vault) {
    docs.push({
      id: `wv-${entry.id}`,
      kind: "writing-vault",
      title: entry.title.trim() || entry.content.trim().slice(0, 48) || "항목",
      body: joinFields(
        entry.title,
        entry.content,
        ...(entry.tags ?? []),
        entry.reference?.workTitle,
        entry.reference?.author,
        entry.reference?.memo,
      ),
      projectId,
      projectName,
      href: writingVaultSearchHref(projectId, entry.id),
    });
  }

  for (const item of foreshadowings) {
    docs.push({
      id: `fs-${item.id}`,
      kind: "foreshadowing",
      title: item.title.trim() || "제목 없는 복선",
      body: joinFields(item.title, item.description, item.status),
      projectId,
      projectName,
      href: foreshadowingSearchHref(projectId, item.id),
    });
  }

  for (const insp of inspirations) {
    docs.push({
      id: `rf-insp-${insp.id}`,
      kind: "reference",
      title: insp.workTitle.trim() || "작품 미기재",
      body: joinFields(
        insp.workTitle,
        insp.author,
        insp.memo,
        insp.selectedText,
      ),
      projectId,
      projectName,
      href: inspirationSearchHref(projectId, insp.id),
    });
  }

  return docs;
}

/** 테스트·캐시용 별칭 */
export class SearchIndex {
  static build = buildSearchIndex;
}
