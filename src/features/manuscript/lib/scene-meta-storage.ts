/**
 * =============================================================================
 * Scene Meta Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 상태·메모·접힘 (원고와 분리, export 제외).
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * =============================================================================
 */

import type {
  Scene,
  SceneMeta,
  SceneStatus,
} from "@/features/manuscript/types/scene";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudListSceneMetasByDocument,
  cloudReplaceSceneMetas,
} from "@/database/supabase/scene-metas-repo";
import { SCENE_METAS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { SCENE_METAS_STORAGE_KEY };

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocalAll(): SceneMeta[] {
  return readJsonArray<SceneMeta>(SCENE_METAS_STORAGE_KEY);
}

function writeLocalAll(metas: SceneMeta[]): void {
  writeJsonArray(SCENE_METAS_STORAGE_KEY, metas);
}

function readLocalByDocument(documentId: ChapterId): SceneMeta[] {
  return readLocalAll().filter((m) => m.documentId === documentId);
}

/**
 * 클라우드 성공 후 백업 스냅샷만 기록한다.
 * CRUD 경로에서 LocalStorage 를 읽지 않는다.
 */
function backupSceneMetas(list: SceneMeta[]): void {
  writeWorkDataBackup(SCENE_METAS_STORAGE_KEY, list);
}

export function createSceneMetaId(): string {
  return crypto.randomUUID();
}

export async function readSceneMetasByDocument(
  documentId: ChapterId,
): Promise<SceneMeta[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListSceneMetasByDocument(documentId);
    try {
      backupSceneMetas(list);
    } catch {
      // 백업 실패 무시
    }
    return list;
  }
  return readLocalByDocument(documentId);
}

/**
 * 파싱된 Scene 목록에 메타를 합친다.
 * 번호(scene_number) 기준으로 매칭한다.
 */
export function mergeScenesWithMetas(
  scenes: Scene[],
  metas: SceneMeta[],
): Scene[] {
  const byNumber = new Map(metas.map((m) => [m.sceneNumber, m]));
  return scenes.map((scene) => {
    const meta = byNumber.get(scene.number);
    return {
      ...scene,
      status: meta?.status ?? "draft",
      memo: meta?.memo ?? "",
    };
  });
}

export function collapsedIdsFromMetas(metas: SceneMeta[]): Set<number> {
  return new Set(
    metas.filter((m) => m.isCollapsed).map((m) => m.sceneNumber),
  );
}

/** Scene[] + 접힘 상태 → SceneMeta[] 로 변환해 저장 */
export async function saveSceneMetasForDocument(input: {
  projectId: ProjectId;
  documentId: ChapterId;
  scenes: Scene[];
  collapsedNumbers: Set<number>;
}): Promise<SceneMeta[]> {
  const { projectId, documentId, scenes, collapsedNumbers } = input;
  const existing = await readSceneMetasByDocument(documentId);
  const existingByNumber = new Map(existing.map((m) => [m.sceneNumber, m]));
  const timestamp = nowIso();

  const metas: SceneMeta[] = scenes.map((scene) => {
    const prev = existingByNumber.get(scene.number);
    return {
      id: prev?.id ?? createSceneMetaId(),
      projectId,
      documentId,
      sceneNumber: scene.number,
      status: scene.status,
      memo: scene.memo,
      isCollapsed: collapsedNumbers.has(scene.number),
      createdAt: prev?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  });

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudReplaceSceneMetas(metas);
    try {
      backupSceneMetas(metas);
    } catch {
      // 백업 실패 무시
    }
    return metas;
  }

  const others = readLocalAll().filter((m) => m.documentId !== documentId);
  writeLocalAll([...others, ...metas]);
  return metas;
}

export function withSceneStatus(
  scenes: Scene[],
  sceneId: string,
  status: SceneStatus,
): Scene[] {
  return scenes.map((s) => (s.id === sceneId ? { ...s, status } : s));
}

export function withSceneMemo(
  scenes: Scene[],
  sceneId: string,
  memo: string,
): Scene[] {
  return scenes.map((s) => (s.id === sceneId ? { ...s, memo } : s));
}
