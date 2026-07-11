/**
 * =============================================================================
 * Foreshadowing Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteForeshadowing,
  cloudListForeshadowings,
  cloudListForeshadowingsByProject,
  cloudUpsertForeshadowing,
} from "@/database/supabase/foreshadowings-repo";
import { FORESHADOWINGS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { FORESHADOWINGS_STORAGE_KEY };

export interface ForeshadowingInput {
  title: string;
  description?: string;
  status?: Foreshadowing["status"];
  plantedChapterId?: Foreshadowing["plantedChapterId"];
  payoffChapterId?: Foreshadowing["payoffChapterId"];
  relatedCharacterIds?: Foreshadowing["relatedCharacterIds"];
  importance?: Foreshadowing["importance"];
}

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocal(): Foreshadowing[] {
  return readJsonArray<Foreshadowing>(FORESHADOWINGS_STORAGE_KEY);
}

function writeLocal(items: Foreshadowing[]): void {
  writeJsonArray(FORESHADOWINGS_STORAGE_KEY, items);
}

function backupForeshadowings(items: Foreshadowing[]): void {
  writeWorkDataBackup(FORESHADOWINGS_STORAGE_KEY, items);
}

export function createForeshadowingId(): ForeshadowingId {
  return crypto.randomUUID();
}

export async function readAllForeshadowings(): Promise<Foreshadowing[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListForeshadowings();
    backupForeshadowings(list);
    return list;
  }
  return readLocal();
}

export async function readForeshadowingsByProject(
  projectId: ProjectId,
): Promise<Foreshadowing[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListForeshadowingsByProject(projectId);
    try {
      backupForeshadowings(await cloudListForeshadowings());
    } catch {
      // 백업 실패 무시
    }
    return list;
  }
  return readLocal().filter((f) => f.projectId === projectId);
}

export async function createForeshadowing(
  projectId: ProjectId,
  input: ForeshadowingInput,
): Promise<Foreshadowing> {
  const timestamp = nowIso();
  const item: Foreshadowing = {
    id: createForeshadowingId(),
    projectId,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    status: input.status ?? "planned",
    plantedChapterId: input.plantedChapterId,
    payoffChapterId: input.payoffChapterId,
    relatedCharacterIds: input.relatedCharacterIds ?? [],
    importance: input.importance ?? 3,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertForeshadowing(item);
    try {
      backupForeshadowings(await cloudListForeshadowings());
    } catch {
      // 백업 실패 무시
    }
    return item;
  }

  writeLocal([item, ...readLocal()]);
  return item;
}

export async function updateForeshadowing(
  id: ForeshadowingId,
  patch: Partial<ForeshadowingInput>,
): Promise<Foreshadowing | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListForeshadowings();
    const index = all.findIndex((f) => f.id === id);
    if (index < 0) return null;

    const updated: Foreshadowing = {
      ...all[index],
      title: patch.title !== undefined ? patch.title.trim() : all[index].title,
      description:
        patch.description !== undefined
          ? patch.description.trim() || undefined
          : all[index].description,
      status: patch.status ?? all[index].status,
      plantedChapterId:
        patch.plantedChapterId !== undefined
          ? patch.plantedChapterId
          : all[index].plantedChapterId,
      payoffChapterId:
        patch.payoffChapterId !== undefined
          ? patch.payoffChapterId
          : all[index].payoffChapterId,
      relatedCharacterIds:
        patch.relatedCharacterIds ?? all[index].relatedCharacterIds,
      importance: patch.importance ?? all[index].importance,
      updatedAt: nowIso(),
    };
    await cloudUpsertForeshadowing(updated);
    try {
      backupForeshadowings(await cloudListForeshadowings());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocal();
  const index = all.findIndex((f) => f.id === id);
  if (index < 0) return null;

  const updated: Foreshadowing = {
    ...all[index],
    title: patch.title !== undefined ? patch.title.trim() : all[index].title,
    description:
      patch.description !== undefined
        ? patch.description.trim() || undefined
        : all[index].description,
    status: patch.status ?? all[index].status,
    plantedChapterId:
      patch.plantedChapterId !== undefined
        ? patch.plantedChapterId
        : all[index].plantedChapterId,
    payoffChapterId:
      patch.payoffChapterId !== undefined
        ? patch.payoffChapterId
        : all[index].payoffChapterId,
    relatedCharacterIds:
      patch.relatedCharacterIds ?? all[index].relatedCharacterIds,
    importance: patch.importance ?? all[index].importance,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocal(next);
  return updated;
}

export async function deleteForeshadowing(
  id: ForeshadowingId,
): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListForeshadowings();
    if (!all.some((f) => f.id === id)) return false;
    await cloudDeleteForeshadowing(id);
    try {
      backupForeshadowings(await cloudListForeshadowings());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const before = readLocal();
  const after = before.filter((f) => f.id !== id);
  writeLocal(after);
  return after.length < before.length;
}
