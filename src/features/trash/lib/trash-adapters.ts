/**
 * =============================================================================
 * Trash adapters — 엔티티별 capture / removeLive / restoreLive
 * -----------------------------------------------------------------------------
 * trash-manager 가 softDelete 시 이 어댑터를 사용한다.
 * 각 storage 의 purge*(하드 삭제) / upsert 를 연결한다.
 * =============================================================================
 */

import { registerTrashAdapter } from "@/features/trash/lib/trash-manager";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { Memo } from "@/features/memo/types/memo";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { WritingVaultEntry } from "@/features/writing-vault/types/writing-vault-entry";
import type { WordTreasuryEntry } from "@/features/word-treasury/types/word-treasury";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Project } from "@/features/projects/types/project";

import {
  getCharacterById,
  purgeCharacter,
  restoreCharacterFromTrash,
} from "@/features/characters/lib/character-storage";
import {
  getInspirationById,
  purgeInspiration,
  restoreInspirationFromTrash,
} from "@/features/inspiration/lib/inspiration-storage";
import {
  getMemoById,
  purgeMemo,
  restoreMemoFromTrash,
} from "@/features/memo/lib/memo-storage";
import {
  getForeshadowingById,
  purgeForeshadowing,
  restoreForeshadowingFromTrash,
} from "@/features/foreshadowing/lib/foreshadowing-storage";
import {
  getTimelineEventById,
  purgeTimelineEvent,
  restoreTimelineEventFromTrash,
} from "@/features/timeline/lib/timeline-event-storage";
import {
  getDialogueById,
  purgeDialogue,
  restoreDialogueFromTrash,
} from "@/features/dialogue-vault/lib/dialogue-storage";
import {
  getWordTreasuryEntryById,
  purgeWordTreasuryEntry,
  restoreWordTreasuryFromTrash,
} from "@/features/word-treasury/lib/word-treasury-storage";
import {
  getChapterById,
  purgeChapter,
  restoreChapterFromTrash,
} from "@/features/manuscript/lib/chapter-storage";
import { getManuscriptByChapterId } from "@/features/manuscript/lib/manuscript-storage";
import {
  getProjectById,
  hideProject,
  restoreProjectFromTrash,
} from "@/features/projects/lib/project-storage";

registerTrashAdapter({
  type: "character",
  capture: async (entityId) => {
    const item = await getCharacterById(entityId as Character["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.name,
      payload: item,
    };
  },
  removeLive: (entityId) => purgeCharacter(entityId as Character["id"]),
  restoreLive: (payload) => restoreCharacterFromTrash(payload),
});

registerTrashAdapter({
  type: "inspiration",
  capture: async (entityId) => {
    const item = await getInspirationById(entityId as Inspiration["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.workTitle || item.selectedText.slice(0, 40) || "Inspiration",
      payload: item,
    };
  },
  removeLive: (entityId) => purgeInspiration(entityId as Inspiration["id"]),
  restoreLive: (payload) => restoreInspirationFromTrash(payload),
});

registerTrashAdapter({
  type: "memo",
  capture: async (entityId) => {
    const item = await getMemoById(entityId as Memo["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.body.slice(0, 40) || "Memo",
      payload: item,
    };
  },
  removeLive: (entityId) => purgeMemo(entityId as Memo["id"]),
  restoreLive: (payload) => restoreMemoFromTrash(payload),
});

registerTrashAdapter({
  type: "foreshadowing",
  capture: async (entityId) => {
    const item = await getForeshadowingById(entityId as Foreshadowing["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.title || "Foreshadowing",
      payload: item,
    };
  },
  removeLive: (entityId) =>
    purgeForeshadowing(entityId as Foreshadowing["id"]),
  restoreLive: (payload) => restoreForeshadowingFromTrash(payload),
});

registerTrashAdapter({
  type: "timeline",
  capture: async (entityId) => {
    const item = await getTimelineEventById(entityId as TimelineEvent["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.title || "Timeline",
      payload: item,
    };
  },
  removeLive: (entityId) =>
    purgeTimelineEvent(entityId as TimelineEvent["id"]),
  restoreLive: (payload) => restoreTimelineEventFromTrash(payload),
});

registerTrashAdapter({
  type: "writing-vault",
  capture: async (entityId) => {
    const item = await getDialogueById(entityId as WritingVaultEntry["id"]);
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.title || item.content.slice(0, 40) || "Writing Vault",
      payload: item,
    };
  },
  removeLive: (entityId) =>
    purgeDialogue(entityId as WritingVaultEntry["id"]),
  restoreLive: (payload) => restoreDialogueFromTrash(payload),
});

registerTrashAdapter({
  type: "word-treasury",
  capture: async (entityId) => {
    const item = await getWordTreasuryEntryById(
      entityId as WordTreasuryEntry["id"],
    );
    if (!item) return null;
    return {
      projectId: item.projectId,
      entityId: item.id,
      name: item.word || "Word",
      payload: item,
    };
  },
  removeLive: (entityId) =>
    purgeWordTreasuryEntry(entityId as WordTreasuryEntry["id"]),
  restoreLive: (payload) => restoreWordTreasuryFromTrash(payload),
});

registerTrashAdapter({
  type: "document",
  capture: async (entityId) => {
    const chapter = await getChapterById(entityId as Chapter["id"]);
    if (!chapter) return null;
    const manuscript = await getManuscriptByChapterId(
      chapter.projectId,
      chapter.id,
    );
    return {
      projectId: chapter.projectId,
      entityId: chapter.id,
      name: chapter.title || "Document",
      payload: { chapter, manuscript } satisfies {
        chapter: Chapter;
        manuscript: Manuscript | null;
      },
    };
  },
  removeLive: (entityId) => purgeChapter(entityId as Chapter["id"]),
  restoreLive: (payload) => restoreChapterFromTrash(payload),
});

registerTrashAdapter({
  type: "project",
  capture: async (entityId) => {
    const project = await getProjectById(entityId as Project["id"]);
    if (!project) return null;
    return {
      projectId: project.id,
      entityId: project.id,
      name: project.title || "Project",
      payload: project,
    };
  },
  /** Soft-hide only — CASCADE purge 는 permanentDelete → purgeProject */
  removeLive: (entityId) => hideProject(entityId as Project["id"]),
  restoreLive: (payload) => restoreProjectFromTrash(payload),
});
