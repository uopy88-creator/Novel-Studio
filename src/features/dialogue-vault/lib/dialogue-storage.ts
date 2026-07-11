/**
 * =============================================================================
 * Writing Vault Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 테이블: writing_vault
 * 종류: sentence | word | idea
 * =============================================================================
 */

import type {
  WritingVaultEntry,
  WritingVaultReference,
  WritingVaultType,
} from "@/features/dialogue-vault/types/dialogue";
import {
  emptyWritingVaultReference,
  isWritingVaultType,
} from "@/features/dialogue-vault/types/dialogue";
import type { DialogueId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteDialogue,
  cloudListDialogues,
  cloudListDialoguesByProject,
  cloudUpsertDialogue,
} from "@/database/supabase/dialogues-repo";
import { DIALOGUES_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { DIALOGUES_STORAGE_KEY };

/** 생성/수정 입력 */
export interface WritingVaultInput {
  type: WritingVaultType;
  title?: string;
  content: string;
  tags: string[];
  reference?: Partial<WritingVaultReference>;
}

/** @deprecated WritingVaultInput 사용 */
export type DialogueInput = WritingVaultInput;

function normalizeReference(
  raw: unknown,
): WritingVaultReference {
  if (!raw || typeof raw !== "object") {
    return emptyWritingVaultReference();
  }
  const item = raw as Partial<WritingVaultReference>;
  return {
    workTitle: typeof item.workTitle === "string" ? item.workTitle : "",
    author: typeof item.author === "string" ? item.author : "",
    memo: typeof item.memo === "string" ? item.memo : "",
  };
}

function normalizeEntry(raw: unknown): WritingVaultEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<WritingVaultEntry> & {
    text?: string;
    kind?: string;
  };

  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }

  const content =
    typeof item.content === "string"
      ? item.content
      : typeof item.text === "string"
        ? item.text
        : "";

  const type: WritingVaultType = isWritingVaultType(item.type)
    ? item.type
    : isWritingVaultType(item.kind)
      ? item.kind
      : "sentence";

  return {
    id: item.id,
    projectId: item.projectId,
    type,
    title: typeof item.title === "string" ? item.title : "",
    content,
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    reference: normalizeReference(item.reference),
    isFavorite: Boolean(item.isFavorite),
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

function readLocalEntries(): WritingVaultEntry[] {
  return readJsonArray<unknown>(DIALOGUES_STORAGE_KEY)
    .map(normalizeEntry)
    .filter((item): item is WritingVaultEntry => item !== null);
}

function writeLocalEntries(entries: WritingVaultEntry[]): void {
  writeJsonArray(DIALOGUES_STORAGE_KEY, entries);
}

function backupEntries(entries: WritingVaultEntry[]): void {
  writeWorkDataBackup(DIALOGUES_STORAGE_KEY, entries);
}

function createEntryId(): DialogueId {
  return crypto.randomUUID();
}

function sortEntries(list: WritingVaultEntry[]): WritingVaultEntry[] {
  return [...list].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function buildReference(
  input?: Partial<WritingVaultReference>,
): WritingVaultReference {
  return {
    workTitle: (input?.workTitle ?? "").trim(),
    author: (input?.author ?? "").trim(),
    memo: (input?.memo ?? "").trim(),
  };
}

export async function readAllDialogues(): Promise<WritingVaultEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const entries = await cloudListDialogues();
    backupEntries(entries);
    return entries;
  }
  return readLocalEntries();
}

export async function writeAllDialogues(
  entries: WritingVaultEntry[],
): Promise<void> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    for (const entry of entries) {
      await cloudUpsertDialogue(entry);
    }
    backupEntries(await cloudListDialogues());
    return;
  }
  writeLocalEntries(entries);
}

export async function readDialoguesByProject(
  projectId: ProjectId,
): Promise<WritingVaultEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListDialoguesByProject(projectId);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return sortEntries(list);
  }

  return sortEntries(
    readLocalEntries().filter((entry) => entry.projectId === projectId),
  );
}

export function parseTagsInput(raw: string): string[] {
  const parts = raw
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

export async function createDialogue(
  projectId: ProjectId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry> {
  const timestamp = nowIso();

  const entry: WritingVaultEntry = {
    id: createEntryId(),
    projectId,
    type: input.type,
    title: (input.title ?? "").trim(),
    content: input.content.trim(),
    tags: input.tags,
    reference: buildReference(input.reference),
    isFavorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertDialogue(entry);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return entry;
  }

  writeLocalEntries([...readLocalEntries(), entry]);
  return entry;
}

export async function updateDialogue(
  id: DialogueId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDialogues();
    const index = all.findIndex((entry) => entry.id === id);
    if (index < 0) return null;

    const updated: WritingVaultEntry = {
      ...all[index],
      type: input.type,
      title: (input.title ?? "").trim(),
      content: input.content.trim(),
      tags: input.tags,
      reference: buildReference(input.reference),
      updatedAt: nowIso(),
    };
    await cloudUpsertDialogue(updated);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalEntries();
  const index = all.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const updated: WritingVaultEntry = {
    ...all[index],
    type: input.type,
    title: (input.title ?? "").trim(),
    content: input.content.trim(),
    tags: input.tags,
    reference: buildReference(input.reference),
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalEntries(next);
  return updated;
}

export async function deleteDialogue(id: DialogueId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDialogues();
    if (!all.some((entry) => entry.id === id)) return false;
    await cloudDeleteDialogue(id);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const all = readLocalEntries();
  if (!all.some((entry) => entry.id === id)) return false;
  writeLocalEntries(all.filter((entry) => entry.id !== id));
  return true;
}

export async function toggleDialogueFavorite(
  id: DialogueId,
): Promise<WritingVaultEntry | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDialogues();
    const index = all.findIndex((entry) => entry.id === id);
    if (index < 0) return null;
    const updated: WritingVaultEntry = {
      ...all[index],
      isFavorite: !all[index].isFavorite,
      updatedAt: nowIso(),
    };
    await cloudUpsertDialogue(updated);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalEntries();
  const index = all.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const updated: WritingVaultEntry = {
    ...all[index],
    isFavorite: !all[index].isFavorite,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalEntries(next);
  return updated;
}

/**
 * 검색 — 본문 · 제목 · 태그 · Reference(작품/작가/메모)
 * 태그 전용 검색도 같은 쿼리로 처리 (예: #유머 또는 유머)
 */
export function filterDialogues(
  entries: WritingVaultEntry[],
  query: string,
): WritingVaultEntry[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return entries;

  const needle = raw.startsWith("#") ? raw.slice(1).trim() : raw;
  if (!needle) return entries;

  return entries.filter((entry) => {
    if (entry.content.toLowerCase().includes(needle)) return true;
    if (entry.title.toLowerCase().includes(needle)) return true;
    if (entry.reference.workTitle.toLowerCase().includes(needle)) return true;
    if (entry.reference.author.toLowerCase().includes(needle)) return true;
    if (entry.reference.memo.toLowerCase().includes(needle)) return true;
    return entry.tags.some((tag) => tag.toLowerCase().includes(needle));
  });
}

/** 종류 필터 — null/"all" 이면 전체 */
export function filterDialoguesByType(
  entries: WritingVaultEntry[],
  type: WritingVaultType | "all",
): WritingVaultEntry[] {
  if (type === "all") return entries;
  return entries.filter((entry) => entry.type === type);
}
