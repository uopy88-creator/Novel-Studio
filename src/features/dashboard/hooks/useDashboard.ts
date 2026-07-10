"use client";

/**
 * =============================================================================
 * useDashboard
 * -----------------------------------------------------------------------------
 * Dashboard 스냅샷 — Cloud 우선 읽기 (보기 전용).
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
  featuredCharacters: [],
  recentInspirations: [],
};

export function useDashboard(projectId: ProjectId) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    setSnapshot(await buildDashboardSnapshot(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { snapshot, isReady, refresh };
}
