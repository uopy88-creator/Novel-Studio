"use client";

/**
 * =============================================================================
 * useScenes
 * -----------------------------------------------------------------------------
 * - 원고 content → Scene 파싱 (#1 #2 …)
 * - status / memo / 접힘 → scene_metas (클라우드 단일 소스, LocalStorage 백업)
 * - 순서·제목·추가·삭제는 content 재직렬화 → Manuscript autosave
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Scene,
  SceneStatus,
} from "@/features/manuscript/types/scene";
import { DEFAULT_SCENE_DELIMITER } from "@/features/manuscript/types/scene";
import type { ChapterId, ProjectId } from "@/types/ids";
import { parseScenes } from "@/features/manuscript/lib/scene-parser";
import {
  addScene,
  applyScenesToContent,
  deleteScene,
  renameScene,
  reorderScenes,
  type SceneDeleteMode,
} from "@/features/manuscript/lib/scene-operations";
import { readSceneDelimiterConfig } from "@/features/manuscript/lib/scene-delimiter-settings";
import {
  collapsedIdsFromMetas,
  readSceneMetasByDocument,
  saveSceneMetasForDocument,
  withSceneMemo,
  withSceneStatus,
} from "@/features/manuscript/lib/scene-meta-storage";

export interface UseScenesResult {
  scenes: Scene[];
  collapsedIds: Set<string>;
  metaReady: boolean;
  toggleCollapsed: (sceneId: string) => void;
  setAllCollapsed: (collapsed: boolean) => void;
  reorder: (activeId: string, overId: string) => void;
  add: (afterIndex?: number) => void;
  remove: (sceneId: string, mode?: SceneDeleteMode) => void;
  rename: (sceneId: string, title: string) => void;
  setStatus: (sceneId: string, status: SceneStatus) => void;
  setMemo: (sceneId: string, memo: string) => void;
}

const META_SAVE_MS = 500;

/** remumber 후에도 접힘을 유지하기 위한 지문 */
function sceneFingerprint(scene: Scene): string {
  return `${scene.title}::${scene.body.slice(0, 48)}`;
}

export function useScenes(
  projectId: ProjectId,
  documentId: ChapterId | null,
  content: string,
  setContent: (value: string) => void,
): UseScenesResult {
  const config = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_SCENE_DELIMITER;
    return readSceneDelimiterConfig();
  }, []);

  const [metaByNumber, setMetaByNumber] = useState<
    Map<number, { status: SceneStatus; memo: string }>
  >(() => new Map());
  const [collapsedNumbers, setCollapsedNumbers] = useState<Set<number>>(
    () => new Set(),
  );
  const [metaReady, setMetaReady] = useState(false);

  // 문서 전환 시 메타 로드
  useEffect(() => {
    let cancelled = false;
    setMetaReady(false);

    if (!documentId) {
      setMetaByNumber(new Map());
      setCollapsedNumbers(new Set());
      setMetaReady(true);
      return;
    }

    void (async () => {
      try {
        const metas = await readSceneMetasByDocument(documentId);
        if (cancelled) return;
        setMetaByNumber(
          new Map(
            metas.map((m) => [
              m.sceneNumber,
              { status: m.status, memo: m.memo },
            ]),
          ),
        );
        setCollapsedNumbers(collapsedIdsFromMetas(metas));
        setMetaReady(true);
      } catch (error) {
        console.error("[useScenes] scene meta load failed", error);
        if (cancelled) return;
        setMetaByNumber(new Map());
        setCollapsedNumbers(new Set());
        setMetaReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const parsed = useMemo(
    () => parseScenes(content, config),
    [content, config],
  );

  const scenes = useMemo(
    () =>
      parsed.map((scene) => {
        const meta = metaByNumber.get(scene.number);
        return {
          ...scene,
          status: meta?.status ?? scene.status,
          memo: meta?.memo ?? scene.memo,
        };
      }),
    [parsed, metaByNumber],
  );

  const collapsedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const scene of scenes) {
      if (collapsedNumbers.has(scene.number)) ids.add(scene.id);
    }
    return ids;
  }, [scenes, collapsedNumbers]);

  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const collapsedRef = useRef(collapsedNumbers);
  collapsedRef.current = collapsedNumbers;
  const metaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistMetas = useCallback(
    (nextScenes: Scene[], nextCollapsed: Set<number>) => {
      if (!documentId) return;
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
      metaTimerRef.current = setTimeout(() => {
        void saveSceneMetasForDocument({
          projectId,
          documentId,
          scenes: nextScenes,
          collapsedNumbers: nextCollapsed,
        }).catch((error) => {
          console.error("[useScenes] scene meta save failed", error);
        });
      }, META_SAVE_MS);
    },
    [documentId, projectId],
  );

  const syncMetaStateFromScenes = useCallback((next: Scene[]) => {
    setMetaByNumber(
      new Map(next.map((s) => [s.number, { status: s.status, memo: s.memo }])),
    );
  }, []);

  /**
   * content 를 바꾸는 작업(순서/제목/추가/삭제).
   * remumber 후 id 가 바뀌므로 접힘은 fingerprint 로 이어 받는다.
   */
  const commitContent = useCallback(
    (next: Scene[]) => {
      const oldCollapsedFingerprints = new Set(
        scenesRef.current
          .filter((s) => collapsedRef.current.has(s.number))
          .map(sceneFingerprint),
      );
      const nextCollapsed = new Set<number>();
      for (const scene of next) {
        if (oldCollapsedFingerprints.has(sceneFingerprint(scene))) {
          nextCollapsed.add(scene.number);
        }
      }

      setContent(applyScenesToContent(next, config));
      syncMetaStateFromScenes(next);
      setCollapsedNumbers(nextCollapsed);
      persistMetas(next, nextCollapsed);
    },
    [config, persistMetas, setContent, syncMetaStateFromScenes],
  );

  const toggleCollapsed = useCallback(
    (sceneId: string) => {
      const scene = scenesRef.current.find((s) => s.id === sceneId);
      if (!scene) return;
      setCollapsedNumbers((prev) => {
        const next = new Set(prev);
        if (next.has(scene.number)) next.delete(scene.number);
        else next.add(scene.number);
        persistMetas(scenesRef.current, next);
        return next;
      });
    },
    [persistMetas],
  );

  const setAllCollapsed = useCallback(
    (collapsed: boolean) => {
      const next = collapsed
        ? new Set(scenesRef.current.map((s) => s.number))
        : new Set<number>();
      setCollapsedNumbers(next);
      persistMetas(scenesRef.current, next);
    },
    [persistMetas],
  );

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      commitContent(reorderScenes(scenesRef.current, activeId, overId));
    },
    [commitContent],
  );

  const add = useCallback(
    (afterIndex?: number) => {
      commitContent(addScene(scenesRef.current, afterIndex));
    },
    [commitContent],
  );

  const remove = useCallback(
    (sceneId: string, mode: SceneDeleteMode = "full") => {
      commitContent(deleteScene(scenesRef.current, sceneId, mode));
    },
    [commitContent],
  );

  const rename = useCallback(
    (sceneId: string, title: string) => {
      commitContent(renameScene(scenesRef.current, sceneId, title));
    },
    [commitContent],
  );

  const setStatus = useCallback(
    (sceneId: string, status: SceneStatus) => {
      const next = withSceneStatus(scenesRef.current, sceneId, status);
      syncMetaStateFromScenes(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromScenes],
  );

  const setMemo = useCallback(
    (sceneId: string, memo: string) => {
      const next = withSceneMemo(scenesRef.current, sceneId, memo);
      syncMetaStateFromScenes(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromScenes],
  );

  useEffect(() => {
    return () => {
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
    };
  }, []);

  return {
    scenes,
    collapsedIds,
    metaReady,
    toggleCollapsed,
    setAllCollapsed,
    reorder,
    add,
    remove,
    rename,
    setStatus,
    setMemo,
  };
}
