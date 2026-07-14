/**
 * =============================================================================
 * Trash Storage — LocalStorage + Supabase trash_items
 * -----------------------------------------------------------------------------
 * Recovery 와 달리 클라우드에도 동기화한다 (기기 간 휴지통 공유).
 * =============================================================================
 */

import type { TrashItem } from "@/features/trash/types/trash-item";
import type { ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteTrashItem,
  cloudListTrashByProject,
  cloudUpsertTrashItem,
} from "@/database/supabase/trash-repo";
import { TRASH_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  canUseStorage,
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";
import { computeExpiresAt } from "@/features/trash/types/trash-item";
import type { TrashEntityType } from "@/features/trash/types/trash-item";

export { TRASH_STORAGE_KEY };

function readLocalAll(): TrashItem[] {
  if (!canUseStorage()) return [];
  return readJsonArray<TrashItem>(TRASH_STORAGE_KEY).filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.projectId === "string" &&
      typeof item.entityType === "string" &&
      typeof item.entityId === "string",
  );
}

function writeLocalAll(items: TrashItem[]): void {
  if (!canUseStorage()) return;
  writeJsonArray(TRASH_STORAGE_KEY, items);
}

async function backupFromCloud(projectId?: ProjectId): Promise<void> {
  if (!isSupabaseDataMode()) return;
  try {
    if (projectId) {
      const list = await cloudListTrashByProject(projectId);
      const others = readLocalAll().filter((i) => i.projectId !== projectId);
      writeLocalAll([...others, ...list]);
    }
    writeWorkDataBackup(TRASH_STORAGE_KEY, readLocalAll());
  } catch {
    // 백업 실패는 본 흐름을 막지 않음
  }
}

export async function listTrashByProject(
  projectId: ProjectId,
): Promise<TrashItem[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListTrashByProject(projectId);
    void backupFromCloud(projectId);
    return list.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  }

  return readLocalAll()
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export async function getTrashItem(
  trashId: string,
): Promise<TrashItem | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const { cloudGetTrashItem } = await import(
      "@/database/supabase/trash-repo"
    );
    const remote = await cloudGetTrashItem(trashId);
    if (remote) return remote;
  }
  return readLocalAll().find((i) => i.id === trashId) ?? null;
}

export async function addTrashItem(input: {
  projectId: ProjectId;
  entityType: TrashEntityType;
  entityId: string;
  name: string;
  payload: unknown;
}): Promise<TrashItem> {
  const deletedAt = nowIso();
  const item: TrashItem = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    entityType: input.entityType,
    entityId: input.entityId,
    name: input.name.trim() || "(제목 없음)",
    deletedAt,
    expiresAt: computeExpiresAt(deletedAt),
    payload: input.payload,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertTrashItem(item);
    const local = readLocalAll().filter((i) => i.id !== item.id);
    writeLocalAll([item, ...local]);
    void backupFromCloud(input.projectId);
    return item;
  }

  writeLocalAll([item, ...readLocalAll().filter((i) => i.id !== item.id)]);
  return item;
}

export async function removeTrashItem(trashId: string): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudDeleteTrashItem(trashId);
    writeLocalAll(readLocalAll().filter((i) => i.id !== trashId));
    writeWorkDataBackup(TRASH_STORAGE_KEY, readLocalAll());
    return true;
  }

  const before = readLocalAll();
  const next = before.filter((i) => i.id !== trashId);
  if (next.length === before.length) return false;
  writeLocalAll(next);
  return true;
}

/** 프로젝트 전체 휴지통 비우기 (프로젝트 영구삭제 시) */
export async function clearTrashForProject(
  projectId: ProjectId,
): Promise<void> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListTrashByProject(projectId);
    for (const item of list) {
      await cloudDeleteTrashItem(item.id);
    }
  }
  writeLocalAll(readLocalAll().filter((i) => i.projectId !== projectId));
}
