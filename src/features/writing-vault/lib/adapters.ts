/**
 * Writing Vault ↔ 도메인 어댑터 (Memo / Foreshadowing / Inspiration)
 */

import type { Memo, MemoKind } from "@/features/memo/types/memo";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import {
  DEFAULT_FORESHADOWING_STATUS,
  normalizeForeshadowingStatus,
} from "@/features/foreshadowing/types/foreshadowing";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { WritingVaultEntry } from "@/features/writing-vault/types/writing-vault-entry";
import { emptyWritingVaultReference } from "@/features/writing-vault/types/writing-vault-entry";
import type { WritingVaultInput } from "@/features/writing-vault/lib/writing-vault-storage";
import type {
  CharacterId,
  ChapterId,
  DocumentId,
  ForeshadowingId,
} from "@/types/ids";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function memoFromVaultEntry(entry: WritingVaultEntry): Memo {
  const meta = entry.meta ?? {};
  const kind = (asString(meta.kind, "note") || "note") as MemoKind;
  return {
    id: entry.id,
    projectId: entry.projectId,
    body: entry.content,
    kind: ["idea", "todo", "question", "note"].includes(kind) ? kind : "note",
    isPinned: entry.isPinned,
    isResolved: Boolean(meta.isResolved),
    sectionStableId: entry.sectionStableId,
    sourceText: asString(meta.sourceText) || undefined,
    chapterId: (entry.documentId as ChapterId | undefined) ?? undefined,
    characterId: (meta.characterId as CharacterId | null) ?? undefined,
    foreshadowingId:
      (meta.foreshadowingId as ForeshadowingId | null) ?? undefined,
    tags: entry.tags,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function memoToVaultInput(memo: {
  body: string;
  kind?: MemoKind;
  isPinned?: boolean;
  isResolved?: boolean;
  sectionStableId?: string;
  sourceText?: string;
  chapterId?: string;
  characterId?: string;
  foreshadowingId?: string;
  tags?: string[];
}): WritingVaultInput {
  return {
    type: "memo",
    title: "",
    content: memo.body,
    tags: memo.tags ?? [],
    isPinned: Boolean(memo.isPinned),
    sectionStableId: memo.sectionStableId,
    documentId: memo.chapterId,
    meta: {
      kind: memo.kind ?? "note",
      isResolved: Boolean(memo.isResolved),
      sourceText: memo.sourceText ?? "",
      characterId: memo.characterId ?? null,
      foreshadowingId: memo.foreshadowingId ?? null,
    },
  };
}

export function foreshadowingFromVaultEntry(
  entry: WritingVaultEntry,
): Foreshadowing {
  const meta = entry.meta ?? {};
  return {
    id: entry.id,
    projectId: entry.projectId,
    title: entry.title,
    description: entry.content || undefined,
    status: normalizeForeshadowingStatus(
      asString(meta.status, DEFAULT_FORESHADOWING_STATUS),
    ),
    plantedSectionStableId:
      asString(meta.plantedSectionStableId) ||
      entry.sectionStableId ||
      undefined,
    payoffSectionStableId:
      asString(meta.payoffSectionStableId) || undefined,
    plantedChapterId:
      (asString(meta.plantedChapterId) as ChapterId) ||
      (entry.documentId as ChapterId | undefined) ||
      undefined,
    payoffChapterId:
      (asString(meta.payoffChapterId) as ChapterId) || undefined,
    relatedCharacterIds: Array.isArray(meta.relatedCharacterIds)
      ? (meta.relatedCharacterIds as CharacterId[])
      : [],
    importance: (() => {
      const n = Math.round(asNumber(meta.importance, 3));
      if (n <= 1) return 1;
      if (n >= 5) return 5;
      return n as 1 | 2 | 3 | 4 | 5;
    })(),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function foreshadowingToVaultInput(item: {
  title: string;
  description?: string;
  status?: Foreshadowing["status"];
  plantedSectionStableId?: string;
  payoffSectionStableId?: string;
  plantedChapterId?: string;
  payoffChapterId?: string;
  relatedCharacterIds?: CharacterId[];
  importance?: number;
}): WritingVaultInput {
  return {
    type: "foreshadowing",
    title: item.title,
    content: item.description ?? "",
    tags: [],
    sectionStableId: item.plantedSectionStableId,
    documentId: item.plantedChapterId,
    meta: {
      status: item.status ?? DEFAULT_FORESHADOWING_STATUS,
      plantedSectionStableId: item.plantedSectionStableId,
      payoffSectionStableId: item.payoffSectionStableId,
      plantedChapterId: item.plantedChapterId,
      payoffChapterId: item.payoffChapterId,
      relatedCharacterIds: item.relatedCharacterIds ?? [],
      importance: item.importance ?? 3,
    },
  };
}

export function inspirationFromVaultEntry(
  entry: WritingVaultEntry,
): Inspiration | null {
  if (!entry.documentId) return null;
  const meta = entry.meta ?? {};
  return {
    id: entry.id,
    projectId: entry.projectId,
    documentId: entry.documentId as DocumentId,
    selectedText: entry.content,
    workTitle: entry.reference.workTitle,
    author: entry.reference.author,
    memo: entry.reference.memo,
    startOffset: asNumber(meta.startOffset, 0),
    endOffset: asNumber(meta.endOffset, 0),
    sectionStableId: entry.sectionStableId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function inspirationToVaultInput(params: {
  documentId: string;
  selectedText: string;
  workTitle: string;
  author: string;
  memo: string;
  startOffset: number;
  endOffset: number;
  sectionStableId?: string;
}): WritingVaultInput {
  return {
    type: "inspiration",
    title: "",
    content: params.selectedText,
    tags: [],
    reference: {
      workTitle: params.workTitle,
      author: params.author,
      memo: params.memo,
    },
    sectionStableId: params.sectionStableId,
    documentId: params.documentId,
    meta: {
      startOffset: params.startOffset,
      endOffset: params.endOffset,
    },
  };
}

export function emptyVaultReference() {
  return emptyWritingVaultReference();
}
