"use client";

/**
 * =============================================================================
 * useManuscriptVersions
 * -----------------------------------------------------------------------------
 * 명시적 버전 스냅샷 — 자동 저장(useManuscript)과 독립.
 * =============================================================================
 */

import { useCallback, useEffect, useState } from "react";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  listManuscriptVersions,
  renameManuscriptVersion,
  saveManuscriptVersionSnapshot,
} from "@/features/manuscript/lib/manuscript-version-storage";

export interface UseManuscriptVersionsResult {
  versions: ManuscriptVersion[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveCurrent: (content: string, name?: string) => Promise<ManuscriptVersion | null>;
  rename: (versionId: string, name: string) => Promise<void>;
}

export function useManuscriptVersions(
  projectId: ProjectId,
  chapterId: ChapterId | null,
): UseManuscriptVersionsResult {
  const [versions, setVersions] = useState<ManuscriptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!chapterId) {
      setVersions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await listManuscriptVersions(projectId, chapterId);
      setVersions(list);
    } catch {
      setError("버전 목록을 불러오지 못했습니다.");
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, chapterId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveCurrent = useCallback(
    async (content: string, name?: string) => {
      if (!chapterId) return null;
      setIsSaving(true);
      setError(null);
      try {
        const saved = await saveManuscriptVersionSnapshot({
          projectId,
          chapterId,
          content,
          name,
        });
        await refresh();
        return saved;
      } catch {
        setError("버전 저장에 실패했습니다.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, chapterId, refresh],
  );

  const rename = useCallback(
    async (versionId: string, name: string) => {
      setError(null);
      try {
        const updated = await renameManuscriptVersion(versionId, name);
        if (!updated) {
          setError("버전 이름을 바꾸지 못했습니다.");
          return;
        }
        setVersions((prev) =>
          prev.map((v) => (v.id === versionId ? updated : v)),
        );
      } catch {
        setError("버전 이름을 바꾸지 못했습니다.");
      }
    },
    [],
  );

  return {
    versions,
    isLoading,
    isSaving,
    error,
    refresh,
    saveCurrent,
    rename,
  };
}
