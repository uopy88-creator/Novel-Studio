/**
 * =============================================================================
 * Writing Vault Storage — 통합 단일 소스
 * -----------------------------------------------------------------------------
 * Supabase: writing_vault 테이블
 * Local: WRITING_VAULT_STORAGE_KEY (+ 레거시 키 1회 병합)
 * =============================================================================
 */

import type {
  WritingVaultEntry,
  WritingVaultMeta,
  WritingVaultReference,
  WritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
import {
  emptyWritingVaultReference,
  normalizeWritingVaultType,
} from "@/features/writing-vault/types/writing-vault-entry";
import { defaultMetaForType } from "@/features/writing-vault/lib/type-defaults";
import type { ProjectId, WritingVaultEntryId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteWritingVaultEntry,
  cloudListWritingVaultByProject,
  cloudListWritingVaultEntries,
  cloudUpsertWritingVaultEntry,
} from "@/database/supabase/writing-vault-repo";
import {
  DIALOGUES_STORAGE_KEY,
  FORESHADOWINGS_STORAGE_KEY,
  INSPIRATIONS_STORAGE_KEY,
  MEMOS_STORAGE_KEY,
  WRITING_VAULT_STORAGE_KEY,
} from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { WRITING_VAULT_STORAGE_KEY };

export interface WritingVaultInput {
  type: WritingVaultType;
  title?: string;
  content: string;
  tags?: string[];
  reference?: Partial<WritingVaultReference>;
  isFavorite?: boolean;
  isPinned?: boolean;
  sectionStableId?: string;
  documentId?: string;
  meta?: WritingVaultMeta;
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

function normalizeMeta(raw: unknown): WritingVaultMeta {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as WritingVaultMeta) };
}

export function normalizeWritingVaultEntry(
  raw: unknown,
): WritingVaultEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<WritingVaultEntry> & {
    text?: string;
    kind?: string;
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

  const type = normalizeWritingVaultType(
    item.type ?? item.entry_type ?? item.kind,
  );

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
    isPinned: Boolean(item.isPinned),
    sectionStableId:
      typeof item.sectionStableId === "string" && item.sectionStableId
        ? item.sectionStableId
        : undefined,
    documentId:
      typeof item.documentId === "string" && item.documentId
        ? item.documentId
        : undefined,
    meta: normalizeMeta(item.meta),
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

/** 레거시 LocalStorage 키에서 1회 병합 */
function readLegacyLocalEntries(): WritingVaultEntry[] {
  const fromDialogues = readJsonArray<unknown>(DIALOGUES_STORAGE_KEY)
    .map(normalizeWritingVaultEntry)
    .filter((e): e is WritingVaultEntry => e !== null);

  const fromMemos = readJsonArray<unknown>(MEMOS_STORAGE_KEY).map((raw) => {
    if (!raw || typeof raw !== "object") return null;
    const m = raw as Record<string, unknown>;
    return normalizeWritingVaultEntry({
      id: m.id,
      projectId: m.projectId,
      type: "memo",
      title: "",
      content: m.body,
      tags: m.tags,
      isPinned: m.isPinned,
      sectionStableId: m.sectionStableId,
      documentId: m.chapterId,
      meta: {
        kind: m.kind ?? "note",
        isResolved: Boolean(m.isResolved),
        sourceText: m.sourceText ?? "",
        characterId: m.characterId ?? null,
        foreshadowingId: m.foreshadowingId ?? null,
      },
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  }).filter((e): e is WritingVaultEntry => e !== null);

  const fromForeshadowings = readJsonArray<unknown>(FORESHADOWINGS_STORAGE_KEY)
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const f = raw as Record<string, unknown>;
      return normalizeWritingVaultEntry({
        id: f.id,
        projectId: f.projectId,
        type: "foreshadowing",
        title: f.title,
        content: f.description,
        tags: [],
        sectionStableId: f.plantedSectionStableId,
        documentId: f.plantedChapterId,
        meta: {
          status: f.status ?? "planted",
          plantedSectionStableId: f.plantedSectionStableId,
          payoffSectionStableId: f.payoffSectionStableId,
          plantedChapterId: f.plantedChapterId,
          payoffChapterId: f.payoffChapterId,
          relatedCharacterIds: f.relatedCharacterIds ?? [],
          importance: f.importance ?? 3,
        },
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      });
    })
    .filter((e): e is WritingVaultEntry => e !== null);

  const fromInspirations = readJsonArray<unknown>(INSPIRATIONS_STORAGE_KEY)
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const i = raw as Record<string, unknown>;
      return normalizeWritingVaultEntry({
        id: i.id,
        projectId: i.projectId,
        type: "inspiration",
        title: "",
        content: i.selectedText,
        tags: [],
        reference: {
          workTitle: i.workTitle,
          author: i.author,
          memo: i.memo,
        },
        sectionStableId: i.sectionStableId,
        documentId: i.documentId,
        meta: {
          startOffset: i.startOffset ?? 0,
          endOffset: i.endOffset ?? 0,
        },
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      });
    })
    .filter((e): e is WritingVaultEntry => e !== null);

  return [
    ...fromDialogues,
    ...fromMemos,
    ...fromForeshadowings,
    ...fromInspirations,
  ];
}

function readLocalEntries(): WritingVaultEntry[] {
  const primary = readJsonArray<unknown>(WRITING_VAULT_STORAGE_KEY)
    .map(normalizeWritingVaultEntry)
    .filter((e): e is WritingVaultEntry => e !== null);

  // 레거시 키에만 있는 항목을 추가 병합 (이미 있는 id 는 primary 유지)
  const byId = new Map(primary.map((entry) => [entry.id, entry]));
  let gained = 0;
  for (const entry of readLegacyLocalEntries()) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
      gained += 1;
    }
  }

  const merged = [...byId.values()];
  if (gained > 0 || (primary.length === 0 && merged.length > 0)) {
    writeJsonArray(WRITING_VAULT_STORAGE_KEY, merged);
  }
  return merged;
}

function writeLocalEntries(entries: WritingVaultEntry[]): void {
  writeJsonArray(WRITING_VAULT_STORAGE_KEY, entries);
}

function backupEntries(entries: WritingVaultEntry[]): void {
  writeWorkDataBackup(WRITING_VAULT_STORAGE_KEY, entries);
}

export function createWritingVaultEntryId(): WritingVaultEntryId {
  return crypto.randomUUID();
}

function sortEntries(list: WritingVaultEntry[]): WritingVaultEntry[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
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

export async function readAllWritingVaultEntries(): Promise<
  WritingVaultEntry[]
> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const entries = await cloudListWritingVaultEntries();
    backupEntries(entries);
    return entries;
  }
  return readLocalEntries();
}

export async function readWritingVaultByProject(
  projectId: ProjectId,
  type?: WritingVaultType,
): Promise<WritingVaultEntry[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListWritingVaultByProject(projectId, type);
    try {
      backupEntries(await cloudListWritingVaultEntries());
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

export async function createWritingVaultEntry(
  projectId: ProjectId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry> {
  const timestamp = nowIso();
  const type = normalizeWritingVaultType(input.type);
  const entry: WritingVaultEntry = {
    id: createWritingVaultEntryId(),
    projectId,
    type,
    title: (input.title ?? "").trim(),
    content: input.content.trim(),
    tags: input.tags ?? [],
    reference: buildReference(input.reference),
    isFavorite: Boolean(input.isFavorite),
    isPinned: Boolean(input.isPinned),
    sectionStableId: input.sectionStableId,
    documentId: input.documentId,
    meta: {
      ...defaultMetaForType(type),
      ...(input.meta ?? {}),
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertWritingVaultEntry(entry);
    try {
      backupEntries(await cloudListWritingVaultEntries());
    } catch {
      // 백업 실패 무시
    }
    return entry;
  }

  writeLocalEntries([...readLocalEntries(), entry]);
  return entry;
}

export async function updateWritingVaultEntry(
  id: WritingVaultEntryId,
  input: WritingVaultInput,
): Promise<WritingVaultEntry | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListWritingVaultEntries();
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
      isPinned: input.isPinned ?? all[index].isPinned,
      sectionStableId:
        input.sectionStableId !== undefined
          ? input.sectionStableId
          : all[index].sectionStableId,
      documentId:
        input.documentId !== undefined
          ? input.documentId
          : all[index].documentId,
      meta: input.meta ?? all[index].meta,
      updatedAt: nowIso(),
    };
    await cloudUpsertWritingVaultEntry(updated);
    try {
      backupEntries(await cloudListWritingVaultEntries());
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
    isPinned: input.isPinned ?? all[index].isPinned,
    sectionStableId:
      input.sectionStableId !== undefined
        ? input.sectionStableId
        : all[index].sectionStableId,
    documentId:
      input.documentId !== undefined
        ? input.documentId
        : all[index].documentId,
    meta: input.meta ?? all[index].meta,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalEntries(next);
  return updated;
}

export async function deleteWritingVaultEntry(
  id: WritingVaultEntryId,
): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListWritingVaultEntries();
    if (!all.some((e) => e.id === id)) return false;
    await cloudDeleteWritingVaultEntry(id);
    try {
      backupEntries(await cloudListWritingVaultEntries());
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

export async function toggleWritingVaultFavorite(
  id: WritingVaultEntryId,
): Promise<WritingVaultEntry | null> {
  const all = isSupabaseDataMode()
    ? await (async () => {
        await requireCloudDb();
        return cloudListWritingVaultEntries();
      })()
    : readLocalEntries();

  const current = all.find((e) => e.id === id);
  if (!current) return null;

  return updateWritingVaultEntry(id, {
    type: current.type,
    title: current.title,
    content: current.content,
    tags: current.tags,
    reference: current.reference,
    isFavorite: !current.isFavorite,
    isPinned: current.isPinned,
    sectionStableId: current.sectionStableId,
    documentId: current.documentId,
    meta: current.meta,
  });
}

export async function toggleWritingVaultPin(
  id: WritingVaultEntryId,
): Promise<WritingVaultEntry | null> {
  const list = await readAllWritingVaultEntries();
  const current = list.find((e) => e.id === id);
  if (!current) return null;

  return updateWritingVaultEntry(id, {
    type: current.type,
    title: current.title,
    content: current.content,
    tags: current.tags,
    reference: current.reference,
    isFavorite: current.isFavorite,
    isPinned: !current.isPinned,
    sectionStableId: current.sectionStableId,
    documentId: current.documentId,
    meta: current.meta,
  });
}

export function filterWritingVaultEntries(
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

export function filterWritingVaultByType(
  entries: WritingVaultEntry[],
  type: WritingVaultType | "all",
): WritingVaultEntry[] {
  if (type === "all") return entries;
  return entries.filter((entry) => entry.type === type);
}
