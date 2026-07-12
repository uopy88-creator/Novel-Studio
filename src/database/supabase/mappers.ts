/**
 * =============================================================================
 * DB Row ↔ 도메인 매핑
 * =============================================================================
 */

import type {
  Project,
  ProjectStatus,
} from "@/features/projects/types/project";
import {
  DEFAULT_PROJECT_TYPE,
  isProjectType,
} from "@/features/projects/types/project";
import type {
  Chapter,
  ChapterStatus,
  DocumentKind,
} from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { Memo, MemoKind } from "@/features/memo/types/memo";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import { normalizeForeshadowingStatus } from "@/features/foreshadowing/types/foreshadowing";
import type { WordTreasuryEntry } from "@/features/word-treasury/types/word-treasury";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type {
  DbCharacterRow,
  DbDialogueRow,
  DbDocumentRow,
  DbForeshadowingRow,
  DbInspirationRow,
  DbManuscriptRow,
  DbManuscriptVersionRow,
  DbMemoRow,
  DbProjectRow,
  DbTimelineEventRow,
  DbWordTreasuryRow,
} from "@/database/supabase/types";
import { DEFAULT_CHARACTER_COLOR } from "@/features/characters/types/character";
import type { CharacterId, ChapterId, ForeshadowingId } from "@/types/ids";

export function projectToRow(project: Project, userId: string): DbProjectRow {
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    premise: project.premise ?? null,
    type: project.type ?? DEFAULT_PROJECT_TYPE,
    status: project.status,
    sort_order: project.sortOrder,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

export function rowToProject(row: DbProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    premise: row.premise ?? undefined,
    type: isProjectType(row.type) ? row.type : DEFAULT_PROJECT_TYPE,
    status: row.status as ProjectStatus,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function documentToRow(chapter: Chapter, userId: string): DbDocumentRow {
  return {
    id: chapter.id,
    project_id: chapter.projectId,
    user_id: userId,
    title: chapter.title,
    kind: chapter.kind,
    sort_order: chapter.sortOrder,
    status: chapter.status,
    summary: chapter.summary ?? null,
    word_count: chapter.wordCount,
    created_at: chapter.createdAt,
    updated_at: chapter.updatedAt,
  };
}

export function rowToDocument(row: DbDocumentRow): Chapter {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    kind: row.kind as DocumentKind,
    sortOrder: row.sort_order,
    status: row.status as ChapterStatus,
    summary: row.summary ?? undefined,
    wordCount: row.word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function manuscriptToRow(
  manuscript: Manuscript,
  userId: string,
): DbManuscriptRow {
  return {
    id: manuscript.id,
    project_id: manuscript.projectId,
    document_id: manuscript.chapterId,
    user_id: userId,
    content: manuscript.content,
    plain_text: manuscript.plainText,
    word_count: manuscript.wordCount,
    last_opened_at: manuscript.lastOpenedAt ?? null,
    created_at: manuscript.createdAt,
    updated_at: manuscript.updatedAt,
  };
}

export function rowToManuscript(row: DbManuscriptRow): Manuscript {
  return {
    id: row.id,
    projectId: row.project_id,
    chapterId: row.document_id,
    content: row.content,
    plainText: row.plain_text,
    wordCount: row.word_count,
    lastOpenedAt: row.last_opened_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function manuscriptVersionToRow(
  version: ManuscriptVersion,
  userId: string,
): DbManuscriptVersionRow {
  return {
    id: version.id,
    project_id: version.projectId,
    document_id: version.chapterId,
    manuscript_id: version.manuscriptId,
    user_id: userId,
    version_number: version.versionNumber,
    name: version.name,
    content: version.content,
    plain_text: version.plainText,
    word_count: version.wordCount,
    created_at: version.createdAt,
    updated_at: version.updatedAt,
  };
}

export function rowToManuscriptVersion(
  row: DbManuscriptVersionRow,
): ManuscriptVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    chapterId: row.document_id,
    manuscriptId: row.manuscript_id,
    versionNumber: row.version_number,
    name: row.name ?? "",
    content: row.content,
    plainText: row.plain_text,
    wordCount: row.word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dialogueToRow(dialogue: Dialogue, userId: string): DbDialogueRow {
  return {
    id: dialogue.id,
    project_id: dialogue.projectId,
    user_id: userId,
    entry_type: dialogue.type,
    title: dialogue.title ?? "",
    content: dialogue.content,
    tags: dialogue.tags,
    reference_work_title: dialogue.reference?.workTitle ?? "",
    reference_author: dialogue.reference?.author ?? "",
    reference_memo: dialogue.reference?.memo ?? "",
    is_favorite: dialogue.isFavorite,
    created_at: dialogue.createdAt,
    updated_at: dialogue.updatedAt,
  };
}

export function rowToDialogue(row: DbDialogueRow): Dialogue {
  const rawType = (row as DbDialogueRow & { entry_type?: string }).entry_type;
  const entryType =
    rawType === "word" || rawType === "idea" ? rawType : "sentence";

  return {
    id: row.id,
    projectId: row.project_id,
    type: entryType,
    title: row.title ?? "",
    content: row.content,
    tags: row.tags ?? [],
    reference: {
      workTitle: row.reference_work_title ?? "",
      author: row.reference_author ?? "",
      memo: row.reference_memo ?? "",
    },
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function characterToRow(
  character: Character,
  userId: string,
): DbCharacterRow {
  return {
    id: character.id,
    project_id: character.projectId,
    user_id: userId,
    name: character.name,
    nickname: character.nickname,
    status: character.status,
    intro: character.intro,
    role: character.role,
    age: character.age,
    gender: character.gender,
    occupation: character.occupation,
    personality: character.personality,
    goal: character.goal,
    secret: character.secret,
    memo: character.memo,
    image: character.image,
    color: character.color || DEFAULT_CHARACTER_COLOR,
    is_favorite: character.isFavorite,
    sort_order: character.sortOrder,
    created_at: character.createdAt,
    updated_at: character.updatedAt,
  };
}

export function rowToCharacter(row: DbCharacterRow): Character {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    nickname: row.nickname ?? "",
    status: row.status ?? "",
    intro: row.intro ?? "",
    role: row.role ?? "",
    age: row.age ?? "",
    gender: row.gender ?? "",
    occupation: row.occupation ?? "",
    personality: row.personality ?? "",
    goal: row.goal ?? "",
    secret: row.secret ?? "",
    memo: row.memo ?? "",
    image: row.image ?? "",
    color: row.color || DEFAULT_CHARACTER_COLOR,
    isFavorite: Boolean(row.is_favorite),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function inspirationToRow(
  inspiration: Inspiration,
  userId: string,
): DbInspirationRow {
  return {
    id: inspiration.id,
    project_id: inspiration.projectId,
    document_id: inspiration.documentId,
    user_id: userId,
    selected_text: inspiration.selectedText,
    work_title: inspiration.workTitle,
    author: inspiration.author,
    memo: inspiration.memo,
    start_offset: inspiration.startOffset,
    end_offset: inspiration.endOffset,
    created_at: inspiration.createdAt,
    updated_at: inspiration.updatedAt,
  };
}

export function rowToInspiration(row: DbInspirationRow): Inspiration {
  return {
    id: row.id,
    projectId: row.project_id,
    documentId: row.document_id,
    selectedText: row.selected_text ?? "",
    workTitle: row.work_title ?? "",
    author: row.author ?? "",
    memo: row.memo ?? "",
    startOffset: row.start_offset ?? 0,
    endOffset: row.end_offset ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function memoToRow(memo: Memo, userId: string): DbMemoRow {
  return {
    id: memo.id,
    project_id: memo.projectId,
    user_id: userId,
    body: memo.body,
    kind: memo.kind,
    is_pinned: memo.isPinned,
    is_resolved: memo.isResolved,
    document_id: memo.chapterId ?? null,
    character_id: memo.characterId ?? null,
    foreshadowing_id: memo.foreshadowingId ?? null,
    tags: memo.tags ?? [],
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  };
}

export function rowToMemo(row: DbMemoRow): Memo {
  return {
    id: row.id,
    projectId: row.project_id,
    body: row.body ?? "",
    kind: (row.kind as MemoKind) || "note",
    isPinned: Boolean(row.is_pinned),
    isResolved: Boolean(row.is_resolved),
    chapterId: (row.document_id as ChapterId | null) ?? undefined,
    characterId: (row.character_id as CharacterId | null) ?? undefined,
    foreshadowingId:
      (row.foreshadowing_id as ForeshadowingId | null) ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function wordTreasuryToRow(
  entry: WordTreasuryEntry,
  userId: string,
): DbWordTreasuryRow {
  return {
    id: entry.id,
    project_id: entry.projectId,
    user_id: userId,
    word: entry.word,
    meaning: entry.meaning,
    example: entry.example,
    note: entry.note,
    tags: entry.tags ?? [],
    is_favorite: entry.isFavorite,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

export function rowToWordTreasury(row: DbWordTreasuryRow): WordTreasuryEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    word: row.word ?? "",
    meaning: row.meaning ?? "",
    example: row.example ?? "",
    note: row.note ?? "",
    tags: row.tags ?? [],
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clampImportance(value: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(value);
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 5;
}

export function foreshadowingToRow(
  item: Foreshadowing,
  userId: string,
): DbForeshadowingRow {
  return {
    id: item.id,
    project_id: item.projectId,
    user_id: userId,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    planted_document_id: item.plantedChapterId ?? null,
    payoff_document_id: item.payoffChapterId ?? null,
    related_character_ids: item.relatedCharacterIds ?? [],
    importance: item.importance,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function rowToForeshadowing(row: DbForeshadowingRow): Foreshadowing {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    description: row.description ?? undefined,
    // 구 상태(planned/dropped)도 새 상태(planted 등)로 정규화
    status: normalizeForeshadowingStatus(row.status),
    plantedChapterId:
      (row.planted_document_id as ChapterId | null) ?? undefined,
    payoffChapterId: (row.payoff_document_id as ChapterId | null) ?? undefined,
    relatedCharacterIds: (row.related_character_ids ?? []) as CharacterId[],
    importance: clampImportance(row.importance ?? 3),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function timelineEventToRow(
  event: TimelineEvent,
  userId: string,
): DbTimelineEventRow {
  return {
    id: event.id,
    project_id: event.projectId,
    user_id: userId,
    title: event.title,
    description: event.description,
    sort_order: event.sortOrder,
    document_id: event.documentId ?? null,
    // DB 컬럼명은 하위 호환 — 도메인은 sectionStableId
    scene_stable_id: event.sectionStableId ?? null,
    character_id: event.characterId ?? null,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
}

export function rowToTimelineEvent(row: DbTimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    description: row.description ?? "",
    sortOrder: row.sort_order ?? 0,
    documentId: (row.document_id as ChapterId | null) ?? undefined,
    sectionStableId: row.scene_stable_id ?? undefined,
    characterId: (row.character_id as CharacterId | null) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
