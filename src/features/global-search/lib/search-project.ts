/**
 * =============================================================================
 * 프로젝트 전체 검색 엔진
 * -----------------------------------------------------------------------------
 * Manuscript · Scene 제목 · Character · Memo · Writing Vault · 복선 · Reference
 * 를 병렬로 읽어 쿼리에 맞는 결과를 종류별로 그룹화한다.
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import type {
  SearchResultGroup,
  SearchResultItem,
  SearchResultKind,
} from "@/features/global-search/types/search";
import {
  SEARCH_GROUP_META,
  SEARCH_KIND_ORDER,
} from "@/features/global-search/types/search";
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

/** 문서당 Manuscript 본문 매치 상한 (결과 폭주 방지) */
const MAX_MATCHES_PER_DOCUMENT = 4;

function includesIgnoreCase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function clip(text: string, max = 96): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function joinFields(...parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * 프로젝트 데이터에서 검색 결과를 수집한다.
 */
export async function searchProject(
  projectId: ProjectId,
  rawQuery: string,
): Promise<SearchResultGroup[]> {
  const query = rawQuery.trim();
  if (!query) return [];

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
    chapters.map((c) => [c.id, c.title.trim() || "제목 없는 Document"]),
  );
  const projectManuscripts = manuscripts.filter(
    (m) => m.projectId === projectId,
  );

  const buckets: Record<SearchResultKind, SearchResultItem[]> = {
    manuscript: [],
    scene: [],
    character: [],
    memo: [],
    "writing-vault": [],
    foreshadowing: [],
    reference: [],
  };

  // --- Manuscript 본문 + Scene 제목 ---
  for (const manuscript of projectManuscripts) {
    const docTitle =
      chapterTitle.get(manuscript.chapterId) ?? "Document";
    const content = manuscript.content ?? manuscript.plainText ?? "";

    const matches = findManuscriptMatches(content, query, "sentence").slice(
      0,
      MAX_MATCHES_PER_DOCUMENT,
    );
    for (const match of matches) {
      buckets.manuscript.push({
        id: `ms-${manuscript.chapterId}-${match.start}`,
        kind: "manuscript",
        title: docTitle,
        preview: match.preview,
        href: manuscriptSearchHref(projectId, manuscript.chapterId, {
          offset: match.start,
          end: match.end,
        }),
      });
    }

    const scenes = parseScenes(content);
    for (const scene of scenes) {
      if (!scene.title.trim()) continue;
      if (!includesIgnoreCase(scene.title, query)) continue;
      buckets.scene.push({
        id: `sc-${manuscript.chapterId}-${scene.id}`,
        kind: "scene",
        title: `${scene.number}. ${scene.title}`,
        preview: `${docTitle} · ${scene.charCount.toLocaleString()}자`,
        href: manuscriptSearchHref(projectId, manuscript.chapterId, {
          sceneId: scene.id,
          offset: scene.startOffset,
        }),
      });
    }
  }

  // --- Character ---
  for (const character of characters) {
    const blob = joinFields(
      character.name,
      character.role,
      character.occupation,
      character.personality,
      character.goal,
      character.secret,
      character.memo,
      character.age,
      character.gender,
    );
    if (!includesIgnoreCase(blob, query)) continue;
    buckets.character.push({
      id: `ch-${character.id}`,
      kind: "character",
      title: character.name || "이름 없음",
      preview: clip(
        joinFields(character.role, character.occupation, character.memo) ||
          "캐릭터",
      ),
      href: characterSearchHref(projectId, character.id),
    });
  }

  // --- Memo ---
  for (const memo of memos) {
    const blob = joinFields(memo.body, ...(memo.tags ?? []));
    if (!includesIgnoreCase(blob, query)) continue;
    buckets.memo.push({
      id: `mm-${memo.id}`,
      kind: "memo",
      title: clip(memo.body, 48) || "빈 메모",
      preview: clip(
        joinFields(memo.kind, ...(memo.tags ?? []).slice(0, 4)),
      ),
      href: memoSearchHref(projectId, memo.id),
    });
  }

  // --- Writing Vault ---
  for (const entry of vault) {
    const blob = joinFields(
      entry.title,
      entry.content,
      ...(entry.tags ?? []),
      entry.reference?.workTitle,
      entry.reference?.author,
      entry.reference?.memo,
    );
    if (!includesIgnoreCase(blob, query)) continue;
    buckets["writing-vault"].push({
      id: `wv-${entry.id}`,
      kind: "writing-vault",
      title: entry.title.trim() || clip(entry.content, 48) || "항목",
      preview: clip(entry.content),
      href: writingVaultSearchHref(projectId, entry.id),
    });
  }

  // --- Foreshadowing (복선) ---
  for (const item of foreshadowings) {
    const blob = joinFields(item.title, item.description);
    if (!includesIgnoreCase(blob, query)) continue;
    buckets.foreshadowing.push({
      id: `fs-${item.id}`,
      kind: "foreshadowing",
      title: item.title.trim() || "제목 없는 복선",
      preview: clip(item.description ?? item.status),
      href: foreshadowingSearchHref(projectId, item.id),
    });
  }

  // --- Reference (Inspiration 작품 + Vault Reference) ---
  for (const insp of inspirations) {
    const blob = joinFields(
      insp.workTitle,
      insp.author,
      insp.memo,
      insp.selectedText,
    );
    if (!includesIgnoreCase(blob, query)) continue;

    const isWorkHit =
      includesIgnoreCase(insp.workTitle, query) ||
      includesIgnoreCase(insp.author, query) ||
      includesIgnoreCase(insp.memo, query);

    // 작품(Reference) 그룹: 작품 필드 매치 또는 작품명이 있는 선택 문장 매치
    if (isWorkHit || insp.workTitle.trim()) {
      buckets.reference.push({
        id: `rf-insp-${insp.id}`,
        kind: "reference",
        title: insp.workTitle.trim() || "작품 미기재",
        preview: clip(
          joinFields(insp.author, insp.memo, insp.selectedText),
        ),
        href: inspirationSearchHref(projectId, insp.id),
      });
    }
  }

  for (const entry of vault) {
    const ref = entry.reference;
    if (!ref) continue;
    const blob = joinFields(ref.workTitle, ref.author, ref.memo);
    if (!ref.workTitle.trim() && !ref.author.trim()) continue;
    if (!includesIgnoreCase(blob, query)) continue;
    // 이미 vault 본문 매치로 들어간 항목과 중복될 수 있음 — Reference 전용 행
    buckets.reference.push({
      id: `rf-vault-${entry.id}`,
      kind: "reference",
      title: ref.workTitle.trim() || "작품 미기재",
      preview: clip(
        joinFields(ref.author, ref.memo, entry.title || entry.content),
      ),
      href: writingVaultSearchHref(projectId, entry.id),
    });
  }

  return SEARCH_KIND_ORDER.map((kind) => ({
    kind,
    label: SEARCH_GROUP_META[kind].label,
    icon: SEARCH_GROUP_META[kind].icon,
    items: buckets[kind],
  })).filter((g) => g.items.length > 0);
}

/** 그룹 배열을 평탄화 (키보드 네비게이션용) */
export function flattenSearchGroups(
  groups: SearchResultGroup[],
): SearchResultItem[] {
  return groups.flatMap((g) => g.items);
}
