/**
 * =============================================================================
 * 검색 결과 → 이동 URL
 * -----------------------------------------------------------------------------
 * studioPath + 쿼리로 딥링크를 만든다.
 * =============================================================================
 */

import { studioPath } from "@/components/layout/nav-items";
import type { ProjectId } from "@/types/ids";

export function manuscriptSearchHref(
  projectId: ProjectId,
  documentId: string,
  options?: { offset?: number; end?: number; sceneId?: string },
): string {
  const params = new URLSearchParams();
  params.set("documentId", documentId);
  if (options?.sceneId) params.set("sceneId", options.sceneId);
  if (typeof options?.offset === "number") {
    params.set("offset", String(options.offset));
  }
  if (typeof options?.end === "number") {
    params.set("end", String(options.end));
  }
  return `${studioPath(projectId, "manuscript")}?${params.toString()}`;
}

export function characterSearchHref(
  projectId: ProjectId,
  characterId: string,
): string {
  return `${studioPath(projectId, "characters")}?id=${encodeURIComponent(characterId)}`;
}

export function writingVaultSearchHref(
  projectId: ProjectId,
  entryId: string,
): string {
  return `${studioPath(projectId, "writing-vault")}?id=${encodeURIComponent(entryId)}`;
}

export function inspirationSearchHref(
  projectId: ProjectId,
  inspirationId: string,
): string {
  return `${studioPath(projectId, "inspiration")}?id=${encodeURIComponent(inspirationId)}`;
}

export function memoSearchHref(projectId: ProjectId, memoId: string): string {
  return `${studioPath(projectId, "memo")}?id=${encodeURIComponent(memoId)}`;
}

export function foreshadowingSearchHref(
  projectId: ProjectId,
  foreshadowingId: string,
): string {
  return `${studioPath(projectId, "foreshadowing")}?id=${encodeURIComponent(foreshadowingId)}`;
}
