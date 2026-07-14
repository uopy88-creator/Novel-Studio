/**
 * =============================================================================
 * Writing Vault Storage — 텍스트 금고 단일 소스
 * -----------------------------------------------------------------------------
 * 테이블: writing_vault
 * 원고 위치(document / section)와 연결하지 않는다.
 * =============================================================================
 */

import type {
  WritingVaultEntry,
  WritingVaultReference,
  WritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
import {
  emptyWritingVaultReference,
  normalizeWritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
import type { ProjectId, WritingVaultEntryId } from "@/types/ids";
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
import {
  DIALOGUES_STORAGE_KEY,
  WRITING_VAULT_STORAGE_KEY,
} from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { DIALOGUES_STORAGE_KEY, WRITING_VAULT_STORAGE_KEY };

export interface WritingVaultInput {
  type: WritingVaultType;
  title?: string;
  content: string;
  tags?: string[];
  reference?: Partial<WritingVaultReference>;
  isFavorite?: boolean;
}

function normalizeReference(raw: unknown): WritingVaultReference {
  if (!raw || typeof raw !== "object") return emptyWritingVaultReference();
  const item = raw as Partial<WritingVaultReference>;
  return {
    workTitle: typeof item.workTitle === "string" ? item.workTitle : "",
    author: typeof item.author === "string" ? item.author : "",
    memo: typeof item.memo === "string" ? item.memo : "",
  };
}

export function normalizeWritingVaultEntry(
  raw: unknown,
): WritingVaultEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<WritingVaultEntry> & {
    text?: string;
    body?: string;
    entry_type?: string;
  };

  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }

  const content =
    typeof item.content === "string"
      ? item.content
      : typeof item.body === "string"
        ? item.body
        : typeof item.text === "string"
          ? item.text
          : "";

  return {
    id: item.id,
    projectId: item.projectId,
    type: normalizeWritingVaultType(item.type ?? item.entry_type),
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
  const primary = readJsonArray<unknown>(WRITING_VAULT_STORAGE_KEY)
    .map(normalizeWritingVaultEntry)
    .filter((e): e is WritingVaultEntry => e !== null);

  if (primary.length > 0) return primary;

  // 레거시 dialogues 키 1회 이전
  const legacy = readJsonArray<unknown>(DIALOGUES_STORAGE_KEY)
    .map(normalizeWritingVaultEntry)
    .filter((e): e is WritingVaultEntry => e !== null);
  if (legacy.length > 0) {
    writeJsonArray(WRITING_VAULT_STORAGE_KEY, legacy);
  }
  return legacy;
}

function writeLocalEntries(entries: WritingVaultEntry[]): void {
  writeJsonArray(WRITING_VAULT_STORAGE_KEY, entries);
}

function backupEntries(entries: WritingVaultEntry[]): void {
  writeWorkDataBackup(WRITING_VAULT_STORAGE_KEY, entries);
}

export function createDialogueId(): WritingVaultEntryId {
  return crypto.randomUUID();
}

function sortEntries(list: WritingVaultEntry[]): WritingVaultEntry[] {
  return [...list].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
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

export async function readDialoguesByProject(
  projectId: ProjectId,
  type?: WritingVaultType,
): Promise<WritingVaultEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListDialoguesByProject(projectId, type);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return sortEntries(list);
  }

  let list = readLocalEntries().filter((e) => e.projectId === projectId);
  if (type) list = list.filter((e) => e.type === type);
  return sortEntries(list);
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
    id: createDialogueId(),
    projectId,
    type: normalizeWritingVaultType(input.type),
    title: (input.title ?? "").trim(),
    content: input.content.trim(),
    tags: input.tags ?? [],
    reference: buildReference(input.reference),
    isFavorite: Boolean(input.isFavorite),
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
  id: WritingVaultEntryId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDialogues();
    const index = all.findIndex((e) => e.id === id);
    if (index < 0) return null;

    const updated: WritingVaultEntry = {
      ...all[index],
      type: normalizeWritingVaultType(input.type),
      title: (input.title ?? "").trim(),
      content: input.content.trim(),
      tags: input.tags ?? all[index].tags,
      reference: buildReference(input.reference ?? all[index].reference),
      isFavorite: input.isFavorite ?? all[index].isFavorite,
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
  const index = all.findIndex((e) => e.id === id);
  if (index < 0) return null;
  const updated: WritingVaultEntry = {
    ...all[index],
    type: normalizeWritingVaultType(input.type),
    title: (input.title ?? "").trim(),
    content: input.content.trim(),
    tags: input.tags ?? all[index].tags,
    reference: buildReference(input.reference ?? all[index].reference),
    isFavorite: input.isFavorite ?? all[index].isFavorite,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalEntries(next);
  return updated;
}

export async function deleteDialogue(
  id: WritingVaultEntryId,
): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListDialogues();
    if (!all.some((e) => e.id === id)) return false;
    await cloudDeleteDialogue(id);
    try {
      backupEntries(await cloudListDialogues());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const all = readLocalEntries();
  if (!all.some((e) => e.id === id)) return false;
  writeLocalEntries(all.filter((e) => e.id !== id));
  return true;
}

export async function toggleDialogueFavorite(
  id: WritingVaultEntryId,
): Promise<WritingVaultEntry | null> {
  const all = isSupabaseDataMode()
    ? await (async () => {
        await requireCloudDb();
        return cloudListDialogues();
      })()
    : readLocalEntries();

  const current = all.find((e) => e.id === id);
  if (!current) return null;

  return updateDialogue(id, {
    type: current.type,
    title: current.title,
    content: current.content,
    tags: current.tags,
    reference: current.reference,
    isFavorite: !current.isFavorite,
  });
}

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

export function filterDialoguesByType(
  entries: WritingVaultEntry[],
  type: WritingVaultType | "all",
): WritingVaultEntry[] {
  if (type === "all") return entries;
  return entries.filter((entry) => entry.type === type);
}
