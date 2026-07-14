/**
 * =============================================================================
 * SearchIndex
 * -----------------------------------------------------------------------------
 * Section 목록은 Section Registry(SSOT) 를 우선 사용한다.
 * 본문 미리보기·오프셋만 Manuscript content 파싱으로 보강한다.
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
import { loadProjectManuscript } from "@/features/manuscript/lib/project-manuscript";
import { findManuscriptMatches } from "@/features/manuscript/lib/search-manuscript";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { readMemosByProject } from "@/features/memo/lib/memo-storage";
import { readDialoguesByProject } from "@/features/dialogue-vault/lib/dialogue-storage";
import { readForeshadowingsByProject } from "@/features/foreshadowing/lib/foreshadowing-storage";
import { foreshadowingStatusLabel } from "@/features/foreshadowing/lib/foreshadowing-service";
import { readInspirationsByProject } from "@/features/inspiration/lib/inspiration-storage";
import {
  formatSectionRefLabel,
  getSectionRegistrySnapshot,
  mergeSectionBodiesById,
  sectionRefsFromContent,
} from "@/features/sections";

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
    manuscriptBundle,
    characters,
    memos,
    vault,
    foreshadowings,
    inspirations,
  ] = await Promise.all([
    loadProjectManuscript(projectId),
    readCharactersByProject(projectId),
    readMemosByProject(projectId),
    readDialoguesByProject(projectId),
    readForeshadowingsByProject(projectId),
    readInspirationsByProject(projectId),
  ]);

  const docs: SearchDocument[] = [];

  // primary Manuscript 만 검색 (구 Chapter/Document 본문은 무시)
  {
    const { content, primaryDocumentId } = manuscriptBundle;
    const docTitle = projectName.trim() || "Manuscript";

    if (trimmed) {
      const matches = findManuscriptMatches(content, trimmed, "sentence").slice(
        0,
        MAX_MATCHES_PER_DOCUMENT,
      );
      for (const match of matches) {
        docs.push({
          id: `ms-${primaryDocumentId}-${match.start}`,
          kind: "manuscript",
          title: docTitle,
          body: match.preview,
          projectId,
          projectName,
          href: manuscriptSearchHref(projectId, primaryDocumentId, {
            offset: match.start,
            end: match.end,
          }),
        });
      }
    }

    // Section 목록 = Registry(SSOT). 미준비 시에만 content 에서 보조.
    const registry = getSectionRegistrySnapshot(projectId);
    const sectionRefs = registry.ready
      ? registry.sections
      : sectionRefsFromContent(content);
    const documentIdForHref =
      registry.primaryDocumentId ?? primaryDocumentId;

    const sectionsWithBody = mergeSectionBodiesById(sectionRefs, content);
    for (const section of sectionsWithBody) {
      docs.push({
        id: `sc-${documentIdForHref}-${section.id}`,
        kind: "section",
        title: formatSectionRefLabel(section),
        body: joinFields(docTitle, section.body.slice(0, 200)),
        projectId,
        projectName,
        href: manuscriptSearchHref(projectId, documentIdForHref, {
          sectionId: section.id,
          offset: section.startOffset,
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
    const sectionLabel = memo.sectionStableId
      ? (() => {
          const registry = getSectionRegistrySnapshot(projectId);
          const ref = registry.sections.find(
            (s) => s.id === memo.sectionStableId,
          );
          return ref ? formatSectionRefLabel(ref) : null;
        })()
      : null;

    docs.push({
      id: `mm-${memo.id}`,
      kind: "memo",
      title: memo.body.trim().slice(0, 48) || "빈 메모",
      body: joinFields(
        memo.body,
        memo.kind,
        sectionLabel,
        ...(memo.tags ?? []),
      ),
      projectId,
      projectName,
      href: memoSearchHref(projectId, memo.id),
    });
  }

  // Memo / Foreshadowing / Inspiration 은 도메인 인덱스로 검색한다.
  // Writing Vault 검색은 Sentence · Word 만 넣어 중복을 막는다.
  for (const entry of vault) {
    if (entry.type !== "sentence" && entry.type !== "word") continue;
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
    const registry = getSectionRegistrySnapshot(projectId);
    const plantedLabel = item.plantedSectionStableId
      ? registry.sections.find((s) => s.id === item.plantedSectionStableId)
      : null;
    const payoffLabel = item.payoffSectionStableId
      ? registry.sections.find((s) => s.id === item.payoffSectionStableId)
      : null;

    docs.push({
      id: `fs-${item.id}`,
      kind: "foreshadowing",
      title: item.title.trim() || "제목 없는 복선",
      body: joinFields(
        item.title,
        item.description,
        foreshadowingStatusLabel(item.status),
        plantedLabel ? formatSectionRefLabel(plantedLabel) : null,
        payoffLabel ? formatSectionRefLabel(payoffLabel) : null,
      ),
      projectId,
      projectName,
      href: foreshadowingSearchHref(projectId, item.id),
    });
  }

  for (const insp of inspirations) {
    const sectionLabel = insp.sectionStableId
      ? (() => {
          const registry = getSectionRegistrySnapshot(projectId);
          const ref = registry.sections.find(
            (s) => s.id === insp.sectionStableId,
          );
          return ref ? formatSectionRefLabel(ref) : null;
        })()
      : null;

    docs.push({
      id: `rf-insp-${insp.id}`,
      kind: "reference",
      title: insp.workTitle.trim() || "작품 미기재",
      body: joinFields(
        insp.workTitle,
        insp.author,
        insp.memo,
        insp.selectedText,
        sectionLabel,
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
