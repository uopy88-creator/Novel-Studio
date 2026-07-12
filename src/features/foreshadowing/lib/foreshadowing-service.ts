/**
 * =============================================================================
 * ForeshadowingService
 * -----------------------------------------------------------------------------
 * Storage 위의 서비스 계층.
 * - 목록 조회 · CRUD
 * - 검색(제목·설명) · 상태 필터 · 정렬
 *
 * 향후 Section 연결 / Character 연결 / 원고 선택 후 자동 등록을
 * 여기에 메서드로 추가하기 쉽도록 분리해 둔다.
 * =============================================================================
 */

import type {
  Foreshadowing,
  ForeshadowingStatus,
} from "@/features/foreshadowing/types/foreshadowing";
import {
  FORESHADOWING_STATUS_LABELS,
} from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";
import {
  createForeshadowing,
  deleteForeshadowing,
  readForeshadowingsByProject,
  updateForeshadowing,
  type ForeshadowingInput,
} from "@/features/foreshadowing/lib/foreshadowing-storage";

/** 정렬 모드 — 최신순 / 오래된순 / 제목순 */
export type ForeshadowingSortMode = "newest" | "oldest" | "title";

/** 상태 필터 — 전체 또는 개별 상태 */
export type ForeshadowingStatusFilter = "all" | ForeshadowingStatus;

export const FORESHADOWING_SORT_OPTIONS: {
  value: ForeshadowingSortMode;
  label: string;
}[] = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "title", label: "제목순" },
];

/**
 * 제목·설명에서 검색한다 (대소문자 무시).
 */
export function filterForeshadowingsByQuery(
  items: Foreshadowing[],
  query: string,
): Foreshadowing[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const title = item.title.toLowerCase();
    const description = (item.description ?? "").toLowerCase();
    return title.includes(q) || description.includes(q);
  });
}

/**
 * 상태 필터. "all" 이면 그대로 반환.
 */
export function filterForeshadowingsByStatus(
  items: Foreshadowing[],
  status: ForeshadowingStatusFilter,
): Foreshadowing[] {
  if (status === "all") return items;
  return items.filter((item) => item.status === status);
}

/**
 * 정렬.
 * - newest: updatedAt 내림차순 (없으면 createdAt)
 * - oldest: updatedAt 오름차순
 * - title: 제목 가나다순
 */
export function sortForeshadowings(
  items: Foreshadowing[],
  mode: ForeshadowingSortMode,
): Foreshadowing[] {
  const list = [...items];

  if (mode === "title") {
    return list.sort((a, b) =>
      a.title.localeCompare(b.title, "ko", { sensitivity: "base" }),
    );
  }

  const getTime = (item: Foreshadowing) =>
    Date.parse(item.updatedAt || item.createdAt) || 0;

  list.sort((a, b) => getTime(a) - getTime(b));
  return mode === "newest" ? list.reverse() : list;
}

/**
 * 검색 + 상태 필터 + 정렬을 한 번에 적용한다.
 */
export function queryForeshadowings(
  items: Foreshadowing[],
  options: {
    query?: string;
    status?: ForeshadowingStatusFilter;
    sort?: ForeshadowingSortMode;
  },
): Foreshadowing[] {
  const searched = filterForeshadowingsByQuery(items, options.query ?? "");
  const filtered = filterForeshadowingsByStatus(
    searched,
    options.status ?? "all",
  );
  return sortForeshadowings(filtered, options.sort ?? "newest");
}

/** 상태별 개수 (필터 탭용) */
export function countForeshadowingsByStatus(
  items: Foreshadowing[],
): Record<ForeshadowingStatusFilter, number> {
  const counts: Record<ForeshadowingStatusFilter, number> = {
    all: items.length,
    planted: 0,
    pending_payoff: 0,
    paid_off: 0,
  };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

/** 상태 한국어 라벨 (검색 인덱스 등에서 재사용) */
export function foreshadowingStatusLabel(
  status: ForeshadowingStatus,
): string {
  return FORESHADOWING_STATUS_LABELS[status];
}

/**
 * ForeshadowingService — 프로젝트 단위 CRUD 진입점.
 * Hook·UI는 Storage를 직접 부르지 않고 이 서비스를 통한다.
 */
export const ForeshadowingService = {
  listByProject(projectId: ProjectId): Promise<Foreshadowing[]> {
    return readForeshadowingsByProject(projectId);
  },

  create(
    projectId: ProjectId,
    input: ForeshadowingInput,
  ): Promise<Foreshadowing> {
    return createForeshadowing(projectId, input);
  },

  update(
    id: ForeshadowingId,
    patch: Partial<ForeshadowingInput>,
  ): Promise<Foreshadowing | null> {
    return updateForeshadowing(id, patch);
  },

  remove(id: ForeshadowingId): Promise<boolean> {
    return deleteForeshadowing(id);
  },

  query: queryForeshadowings,
  countByStatus: countForeshadowingsByStatus,
  statusLabel: foreshadowingStatusLabel,
};
