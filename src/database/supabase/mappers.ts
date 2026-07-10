/**
 * =============================================================================
 * DB Row ↔ 도메인 매핑
 * =============================================================================
 */

import type { Project, ProjectStatus } from "@/features/projects/types/project";
import type {
  Chapter,
  ChapterStatus,
  DocumentKind,
} from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type {
  DbCharacterRow,
  DbDialogueRow,
  DbDocumentRow,
  DbInspirationRow,
  DbManuscriptRow,
  DbProjectRow,
} from "@/database/supabase/types";
import { DEFAULT_CHARACTER_COLOR } from "@/features/characters/types/character";

export function projectToRow(project: Project, userId: string): DbProjectRow {
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    premise: project.premise ?? null,
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

export function dialogueToRow(dialogue: Dialogue, userId: string): DbDialogueRow {
  return {
    id: dialogue.id,
    project_id: dialogue.projectId,
    user_id: userId,
    content: dialogue.content,
    tags: dialogue.tags,
    is_favorite: dialogue.isFavorite,
    created_at: dialogue.createdAt,
    updated_at: dialogue.updatedAt,
  };
}

export function rowToDialogue(row: DbDialogueRow): Dialogue {
  return {
    id: row.id,
    projectId: row.project_id,
    content: row.content,
    tags: row.tags ?? [],
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
