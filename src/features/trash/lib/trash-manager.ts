/**
 * =============================================================================
 * Trash Manager — Soft Delete 공통 API
 * -----------------------------------------------------------------------------
 * UI 는 softDelete / restore / permanentDelete / listTrash 만 호출한다.
 * =============================================================================
 */

import type {
  TrashEntityType,
  TrashItem,
} from "@/features/trash/types/trash-item";
import type { ProjectId } from "@/types/ids";
import {
  addTrashItem,
  clearTrashForProject,
  getTrashItem,
  listTrashByProject,
  removeTrashItem,
} from "@/features/trash/lib/trash-storage";

export interface TrashCaptureResult {
  projectId: ProjectId;
  entityId: string;
  name: string;
  payload: unknown;
}

export interface TrashEntityAdapter {
  type: TrashEntityType;
  capture: (entityId: string) => Promise<TrashCaptureResult | null>;
  removeLive: (entityId: string) => Promise<boolean>;
  restoreLive: (payload: unknown) => Promise<boolean>;
}

const adapters = new Map<TrashEntityType, TrashEntityAdapter>();

export function registerTrashAdapter(adapter: TrashEntityAdapter): void {
  adapters.set(adapter.type, adapter);
}

function requireAdapter(type: TrashEntityType): TrashEntityAdapter {
  const adapter = adapters.get(type);
  if (!adapter) {
    throw new Error(`[TrashManager] adapter not registered: ${type}`);
  }
  return adapter;
}

let adaptersReady = false;
let adaptersReadyPromise: Promise<void> | null = null;

/**
 * 어댑터 지연 등록 — 순환 참조 방지.
 * index.ts 가 adapters 를 side-effect import 하며,
 * softDelete 경로에서도 동적으로 로드해 등록을 보장한다.
 */
export async function ensureTrashAdaptersRegistered(): Promise<void> {
  if (adaptersReady) return;
  if (!adaptersReadyPromise) {
    adaptersReadyPromise = import("@/features/trash/lib/trash-adapters").then(
      () => {
        adaptersReady = true;
      },
    );
  }
  await adaptersReadyPromise;
}

/** Soft Delete — 휴지통 이동 */
export async function softDelete(
  entityType: TrashEntityType,
  entityId: string,
): Promise<boolean> {
  await ensureTrashAdaptersRegistered();
  const adapter = requireAdapter(entityType);
  const captured = await adapter.capture(entityId);
  if (!captured) return false;

  await addTrashItem({
    projectId: captured.projectId,
    entityType,
    entityId: captured.entityId,
    name: captured.name,
    payload: captured.payload,
  });

  return adapter.removeLive(entityId);
}

/** 복원 — payload 로 live 복구 후 trash 항목 제거 */
export async function restore(
  trashId: string,
  projectId?: ProjectId,
): Promise<boolean> {
  await ensureTrashAdaptersRegistered();
  let item = await getTrashItem(trashId);
  if (!item && projectId) {
    const list = await listTrashByProject(projectId);
    item = list.find((i) => i.id === trashId) ?? null;
  }
  if (!item) return false;

  const adapter = requireAdapter(item.entityType);
  const ok = await adapter.restoreLive(item.payload);
  if (!ok) return false;
  await removeTrashItem(trashId);
  return true;
}

/**
 * 영구삭제.
 * - 일반 엔티티: softDelete 시 이미 purge 됨 → trash 행만 제거
 * - project: soft-hide 만 되어 있으므로 여기서 cascade purge
 */
export async function permanentDelete(trashId: string): Promise<boolean> {
  await ensureTrashAdaptersRegistered();
  const item = await getTrashItem(trashId);
  if (!item) return false;

  if (item.entityType === "project") {
    const { purgeProject } = await import(
      "@/features/projects/lib/project-storage"
    );
    await purgeProject(item.entityId as ProjectId);
    // purgeProject 가 해당 project trash 전체를 clear 할 수 있음
    return true;
  }

  await removeTrashItem(trashId);
  return true;
}

export async function listTrash(projectId: ProjectId): Promise<TrashItem[]> {
  return listTrashByProject(projectId);
}

export { clearTrashForProject };
