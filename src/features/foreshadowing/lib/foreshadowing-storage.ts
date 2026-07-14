/**
 * =============================================================================
 * Foreshadowing Storage — Writing Vault facade (type = foreshadowing)
 * =============================================================================
 */

import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import {
  DEFAULT_FORESHADOWING_STATUS,
  normalizeForeshadowingStatus,
} from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";
import {
  createWritingVaultEntry,
  deleteWritingVaultEntry,
  readAllWritingVaultEntries,
  readWritingVaultByProject,
  updateWritingVaultEntry,
} from "@/features/writing-vault/lib/writing-vault-storage";
import {
  foreshadowingFromVaultEntry,
  foreshadowingToVaultInput,
} from "@/features/writing-vault/lib/adapters";
import { FORESHADOWINGS_STORAGE_KEY } from "@/lib/storage/keys";

export { FORESHADOWINGS_STORAGE_KEY };

/** 생성·수정 시 전달하는 입력 (필수: title) */
export interface ForeshadowingInput {
  title: string;
  description?: string;
  status?: Foreshadowing["status"];
  plantedSectionStableId?: Foreshadowing["plantedSectionStableId"];
  payoffSectionStableId?: Foreshadowing["payoffSectionStableId"];
  /** @deprecated Document 링크 — Section 목록 소스 아님 */
  plantedChapterId?: Foreshadowing["plantedChapterId"];
  /** @deprecated Document 링크 — Section 목록 소스 아님 */
  payoffChapterId?: Foreshadowing["payoffChapterId"];
  relatedCharacterIds?: Foreshadowing["relatedCharacterIds"];
  importance?: Foreshadowing["importance"];
}

export function createForeshadowingId(): ForeshadowingId {
  return crypto.randomUUID();
}

export async function readAllForeshadowings(): Promise<Foreshadowing[]> {
  const all = await readAllWritingVaultEntries();
  return all
    .filter((e) => e.type === "foreshadowing")
    .map(foreshadowingFromVaultEntry)
    .map((item) => ({
      ...item,
      status: normalizeForeshadowingStatus(item.status),
    }));
}

export async function readForeshadowingsByProject(
  projectId: ProjectId,
): Promise<Foreshadowing[]> {
  const list = await readWritingVaultByProject(projectId, "foreshadowing");
  return list.map(foreshadowingFromVaultEntry);
}

export async function createForeshadowing(
  projectId: ProjectId,
  input: ForeshadowingInput,
): Promise<Foreshadowing> {
  const entry = await createWritingVaultEntry(
    projectId,
    foreshadowingToVaultInput({
      ...input,
      status: input.status ?? DEFAULT_FORESHADOWING_STATUS,
    }),
  );
  return foreshadowingFromVaultEntry(entry);
}

export async function updateForeshadowing(
  id: ForeshadowingId,
  patch: Partial<ForeshadowingInput>,
): Promise<Foreshadowing | null> {
  const all = await readAllWritingVaultEntries();
  const current = all.find((e) => e.id === id && e.type === "foreshadowing");
  if (!current) return null;

  const item = foreshadowingFromVaultEntry(current);
  const next = foreshadowingToVaultInput({
    title: patch.title !== undefined ? patch.title : item.title,
    description:
      patch.description !== undefined ? patch.description : item.description,
    status: patch.status ?? item.status,
    plantedSectionStableId:
      patch.plantedSectionStableId !== undefined
        ? patch.plantedSectionStableId
        : item.plantedSectionStableId,
    payoffSectionStableId:
      patch.payoffSectionStableId !== undefined
        ? patch.payoffSectionStableId
        : item.payoffSectionStableId,
    plantedChapterId:
      patch.plantedChapterId !== undefined
        ? patch.plantedChapterId
        : item.plantedChapterId,
    payoffChapterId:
      patch.payoffChapterId !== undefined
        ? patch.payoffChapterId
        : item.payoffChapterId,
    relatedCharacterIds:
      patch.relatedCharacterIds ?? item.relatedCharacterIds,
    importance: patch.importance ?? item.importance,
  });

  const updated = await updateWritingVaultEntry(id, next);
  return updated ? foreshadowingFromVaultEntry(updated) : null;
}

export async function deleteForeshadowing(
  id: ForeshadowingId,
): Promise<boolean> {
  return deleteWritingVaultEntry(id);
}
