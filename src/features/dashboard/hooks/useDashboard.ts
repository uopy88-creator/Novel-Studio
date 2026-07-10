"use client";

/**
 * =============================================================================
 * useDashboard
 * -----------------------------------------------------------------------------
 * Dashboard 스냅샷을 LocalStorage에서 읽어 온다.
 * 수정 API는 제공하지 않는다 (보기 전용).
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { ProjectId } from "@/types/ids";
import {
  buildDashboardSnapshot,
  type DashboardSnapshot,
} from "@/features/dashboard/lib/dashboard-data";

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  totalChars: 0,
  charsWithoutSpaces: 0,
  manuscriptSheets: 0,
  bookPages: 0,
  memoCount: 0,
  characterCount: 0,
  recentDocuments: [],
};

export function useDashboard(projectId: ProjectId) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setSnapshot(buildDashboardSnapshot(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
    setIsReady(true);
  }, [refresh]);

  return { snapshot, isReady, refresh };
}
