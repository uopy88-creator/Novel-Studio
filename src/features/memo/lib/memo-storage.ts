/**
 * =============================================================================
 * Memo Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type { Memo } from "@/features/memo/types/memo";
import type { MemoId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteMemo,
  cloudListMemos,
  cloudListMemosByProject,
  cloudUpsertMemo,
} from "@/database/supabase/memos-repo";
import { MEMOS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { MEMOS_STORAGE_KEY };

export interface MemoInput {
  body: string;
  kind?: Memo["kind"];
  isPinned?: boolean;
  isResolved?: boolean;
  chapterId?: Memo["chapterId"];
  characterId?: Memo["characterId"];
  foreshadowingId?: Memo["foreshadowingId"];
  tags?: string[];
}

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocalMemos(): Memo[] {
  return readJsonArray<Memo>(MEMOS_STORAGE_KEY);
}

function writeLocalMemos(memos: Memo[]): void {
  writeJsonArray(MEMOS_STORAGE_KEY, memos);
}

function backupMemos(memos: Memo[]): void {
  writeWorkDataBackup(MEMOS_STORAGE_KEY, memos);
}

export function createMemoId(): MemoId {
  return crypto.randomUUID();
}

export async function readAllMemos(): Promise<Memo[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListMemos();
    backupMemos(list);
    return list;
  }
  return readLocalMemos();
}

export async function readMemosByProject(
  projectId: ProjectId,
): Promise<Memo[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListMemosByProject(projectId);
    try {
      backupMemos(await cloudListMemos());
    } catch {
      // 백업 실패는 본 읽기에 영향 없음
    }
    return list;
  }
  return readLocalMemos().filter((m) => m.projectId === projectId);
}

export async function createMemo(
  projectId: ProjectId,
  input: MemoInput,
): Promise<Memo> {
  const timestamp = nowIso();
  const memo: Memo = {
    id: createMemoId(),
    projectId,
    body: input.body.trim(),
    kind: input.kind ?? "note",
    isPinned: Boolean(input.isPinned),
    isResolved: Boolean(input.isResolved),
    chapterId: input.chapterId,
    characterId: input.characterId,
    foreshadowingId: input.foreshadowingId,
    tags: input.tags ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertMemo(memo);
    try {
      backupMemos(await cloudListMemos());
    } catch {
      // 백업 실패 무시
    }
    return memo;
  }

  writeLocalMemos([memo, ...readLocalMemos()]);
  return memo;
}

export async function updateMemo(
  id: MemoId,
  patch: Partial<MemoInput>,
): Promise<Memo | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListMemos();
    const index = all.findIndex((m) => m.id === id);
    if (index < 0) return null;

    const updated: Memo = {
      ...all[index],
      body: patch.body !== undefined ? patch.body.trim() : all[index].body,
      kind: patch.kind ?? all[index].kind,
      isPinned: patch.isPinned ?? all[index].isPinned,
      isResolved: patch.isResolved ?? all[index].isResolved,
      chapterId:
        patch.chapterId !== undefined ? patch.chapterId : all[index].chapterId,
      characterId:
        patch.characterId !== undefined
          ? patch.characterId
          : all[index].characterId,
      foreshadowingId:
        patch.foreshadowingId !== undefined
          ? patch.foreshadowingId
          : all[index].foreshadowingId,
      tags: patch.tags ?? all[index].tags,
      updatedAt: nowIso(),
    };
    await cloudUpsertMemo(updated);
    try {
      backupMemos(await cloudListMemos());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalMemos();
  const index = all.findIndex((m) => m.id === id);
  if (index < 0) return null;

  const updated: Memo = {
    ...all[index],
    body: patch.body !== undefined ? patch.body.trim() : all[index].body,
    kind: patch.kind ?? all[index].kind,
    isPinned: patch.isPinned ?? all[index].isPinned,
    isResolved: patch.isResolved ?? all[index].isResolved,
    chapterId:
      patch.chapterId !== undefined ? patch.chapterId : all[index].chapterId,
    characterId:
      patch.characterId !== undefined
        ? patch.characterId
        : all[index].characterId,
    foreshadowingId:
      patch.foreshadowingId !== undefined
        ? patch.foreshadowingId
        : all[index].foreshadowingId,
    tags: patch.tags ?? all[index].tags,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalMemos(next);
  return updated;
}

export async function deleteMemo(id: MemoId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListMemos();
    if (!all.some((m) => m.id === id)) return false;
    await cloudDeleteMemo(id);
    try {
      backupMemos(await cloudListMemos());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const before = readLocalMemos();
  const after = before.filter((m) => m.id !== id);
  writeLocalMemos(after);
  return after.length < before.length;
}
