/**
 * =============================================================================
 * Word Treasury Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase 설정 시: CRUD 는 클라우드만. LocalStorage 는 성공 후 백업 쓰기만.
 * Supabase 미설정(로컬 개발) 시에만 LocalStorage 를 데이터 소스로 사용.
 * =============================================================================
 */

import type {
  WordTreasuryEntry,
  WordTreasuryInput,
} from "@/features/word-treasury/types/word-treasury";
import type { ProjectId, WordTreasuryId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteWordTreasury,
  cloudListWordTreasury,
  cloudListWordTreasuryByProject,
  cloudUpsertWordTreasury,
} from "@/database/supabase/word-treasury-repo";
import { WORD_TREASURY_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
} from "@/lib/storage/browser";

export { WORD_TREASURY_STORAGE_KEY };

/** 로컬 전용 모드(Supabase 미설정)에서만 사용 */
function readLocal(): WordTreasuryEntry[] {
  return readJsonArray<WordTreasuryEntry>(WORD_TREASURY_STORAGE_KEY);
}

function writeLocal(entries: WordTreasuryEntry[]): void {
  writeJsonArray(WORD_TREASURY_STORAGE_KEY, entries);
}

function backupWordTreasury(entries: WordTreasuryEntry[]): void {
  writeWorkDataBackup(WORD_TREASURY_STORAGE_KEY, entries);
}

export function createWordTreasuryId(): WordTreasuryId {
  return crypto.randomUUID();
}

export async function readAllWordTreasury(): Promise<WordTreasuryEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListWordTreasury();
    backupWordTreasury(list);
    return list;
  }
  return readLocal();
}

export async function readWordTreasuryByProject(
  projectId: ProjectId,
): Promise<WordTreasuryEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListWordTreasuryByProject(projectId);
    try {
      backupWordTreasury(await cloudListWordTreasury());
    } catch {
      // 백업 실패 무시
    }
    return list;
  }
  return readLocal().filter((e) => e.projectId === projectId);
}

export async function createWordTreasuryEntry(
  projectId: ProjectId,
  input: WordTreasuryInput,
): Promise<WordTreasuryEntry> {
  const timestamp = nowIso();
  const entry: WordTreasuryEntry = {
    id: createWordTreasuryId(),
    projectId,
    word: input.word.trim(),
    meaning: (input.meaning ?? "").trim(),
    example: (input.example ?? "").trim(),
    note: (input.note ?? "").trim(),
    tags: input.tags ?? [],
    isFavorite: Boolean(input.isFavorite),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertWordTreasury(entry);
    try {
      backupWordTreasury(await cloudListWordTreasury());
    } catch {
      // 백업 실패 무시
    }
    return entry;
  }

  writeLocal([entry, ...readLocal()]);
  return entry;
}

export async function updateWordTreasuryEntry(
  id: WordTreasuryId,
  patch: Partial<WordTreasuryInput>,
): Promise<WordTreasuryEntry | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListWordTreasury();
    const index = all.findIndex((e) => e.id === id);
    if (index < 0) return null;

    const updated: WordTreasuryEntry = {
      ...all[index],
      word: patch.word !== undefined ? patch.word.trim() : all[index].word,
      meaning:
        patch.meaning !== undefined
          ? patch.meaning.trim()
          : all[index].meaning,
      example:
        patch.example !== undefined
          ? patch.example.trim()
          : all[index].example,
      note: patch.note !== undefined ? patch.note.trim() : all[index].note,
      tags: patch.tags ?? all[index].tags,
      isFavorite: patch.isFavorite ?? all[index].isFavorite,
      updatedAt: nowIso(),
    };
    await cloudUpsertWordTreasury(updated);
    try {
      backupWordTreasury(await cloudListWordTreasury());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocal();
  const index = all.findIndex((e) => e.id === id);
  if (index < 0) return null;

  const updated: WordTreasuryEntry = {
    ...all[index],
    word: patch.word !== undefined ? patch.word.trim() : all[index].word,
    meaning:
      patch.meaning !== undefined ? patch.meaning.trim() : all[index].meaning,
    example:
      patch.example !== undefined ? patch.example.trim() : all[index].example,
    note: patch.note !== undefined ? patch.note.trim() : all[index].note,
    tags: patch.tags ?? all[index].tags,
    isFavorite: patch.isFavorite ?? all[index].isFavorite,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocal(next);
  return updated;
}

export async function deleteWordTreasuryEntry(
  id: WordTreasuryId,
): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListWordTreasury();
    if (!all.some((e) => e.id === id)) return false;
    await cloudDeleteWordTreasury(id);
    try {
      backupWordTreasury(await cloudListWordTreasury());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const before = readLocal();
  const after = before.filter((e) => e.id !== id);
  writeLocal(after);
  return after.length < before.length;
}
