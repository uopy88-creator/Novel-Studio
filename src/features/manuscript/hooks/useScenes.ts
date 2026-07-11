"use client";

/**
 * =============================================================================
 * useScenes
 * -----------------------------------------------------------------------------
 * - 원고 content → Scene 파싱 (프로그램이 관리하는 내부 마커)
 * - status / memo / 접힘 → scene_metas (클라우드 단일 소스, LocalStorage 백업)
 * - 순서·제목·추가·삭제는 content 재직렬화 → Manuscript autosave
 * - 상태·메모·접힘 변경도 즉시(디바운스) Supabase 동기화
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
  /** 선택한 Scene 아래(또는 맨 끝)에 추가. 새 Scene 안정 ID 반환 */
  add: (afterIndex?: number) => string | null;
  remove: (sceneId: string, mode?: SceneDeleteMode) => void;
  rename: (sceneId: string, title: string) => void;
  setStatus: (sceneId: string, status: SceneStatus) => void;
  setMemo: (sceneId: string, memo: string) => void;
}

const META_SAVE_MS = 500;

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
  /** 접힘은 안정 ID 기준으로 세션 유지 (번호 재계산과 무관) */
  const [collapsedStableIds, setCollapsedStableIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [metaReady, setMetaReady] = useState(false);
  /** 문서 로드 직후 번호→접힘 매핑을 안정 ID로 옮기기 위한 플래그 */
  const pendingCollapseNumbersRef = useRef<Set<number> | null>(null);

  // 문서 전환 시 메타 로드
  useEffect(() => {
    let cancelled = false;
    setMetaReady(false);

    if (!documentId) {
      setMetaByNumber(new Map());
      setCollapsedStableIds(new Set());
      pendingCollapseNumbersRef.current = null;
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
        pendingCollapseNumbersRef.current = collapsedIdsFromMetas(metas);
        setCollapsedStableIds(new Set());
        setMetaReady(true);
      } catch (error) {
        console.error("[useScenes] scene meta load failed", error);
        if (cancelled) return;
        setMetaByNumber(new Map());
        setCollapsedStableIds(new Set());
        pendingCollapseNumbersRef.current = null;
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

  // 메타 로드 직후: scene_number 접힘 → 안정 ID 접힘으로 변환
  useEffect(() => {
    const pending = pendingCollapseNumbersRef.current;
    if (!pending || scenes.length === 0) return;
    const next = new Set<string>();
    for (const scene of scenes) {
      if (pending.has(scene.number)) next.add(scene.id);
    }
    setCollapsedStableIds(next);
    pendingCollapseNumbersRef.current = null;
  }, [scenes]);

  const collapsedIds = collapsedStableIds;

  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const collapsedRef = useRef(collapsedStableIds);
  collapsedRef.current = collapsedStableIds;
  const metaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistMetas = useCallback(
    (nextScenes: Scene[], nextCollapsed: Set<string>) => {
      if (!documentId) return;
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
      metaTimerRef.current = setTimeout(() => {
        const collapsedNumbers = new Set<number>();
        for (const scene of nextScenes) {
          if (nextCollapsed.has(scene.id)) {
            collapsedNumbers.add(scene.number);
          }
        }
        void saveSceneMetasForDocument({
          projectId,
          documentId,
          scenes: nextScenes,
          collapsedNumbers,
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
   * 안정 ID 접힘은 그대로 이어 받는다.
   */
  const commitContent = useCallback(
    (next: Scene[]) => {
      const nextCollapsed = new Set<string>();
      for (const scene of next) {
        if (collapsedRef.current.has(scene.id)) {
          nextCollapsed.add(scene.id);
        }
      }

      setContent(applyScenesToContent(next, config));
      syncMetaStateFromScenes(next);
      setCollapsedStableIds(nextCollapsed);
      persistMetas(next, nextCollapsed);
    },
    [config, persistMetas, setContent, syncMetaStateFromScenes],
  );

  const toggleCollapsed = useCallback(
    (sceneId: string) => {
      setCollapsedStableIds((prev) => {
        const next = new Set(prev);
        if (next.has(sceneId)) next.delete(sceneId);
        else next.add(sceneId);
        persistMetas(scenesRef.current, next);
        return next;
      });
    },
    [persistMetas],
  );

  const setAllCollapsed = useCallback(
    (collapsed: boolean) => {
      const next = collapsed
        ? new Set(scenesRef.current.map((s) => s.id))
        : new Set<string>();
      setCollapsedStableIds(next);
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
      const prevIds = new Set(scenesRef.current.map((s) => s.id));
      const next = addScene(scenesRef.current, afterIndex);
      commitContent(next);
      const created = next.find((s) => !prevIds.has(s.id));
      return created?.id ?? null;
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
