/**
 * =============================================================================
 * Dialogue Storage (Cloud 우선 + LocalStorage 백업)
 * -----------------------------------------------------------------------------
 * 온라인 시 Supabase `dialogues` 테이블. LocalStorage는 백업.
 * =============================================================================
 */

import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { DialogueId, ProjectId } from "@/types/ids";
import { canUseCloudDb } from "@/database/supabase/cloud-mode";
import {
  cloudDeleteDialogue,
  cloudListDialogues,
  cloudListDialoguesByProject,
  cloudUpsertDialogue,
} from "@/database/supabase/dialogues-repo";
import { DIALOGUES_STORAGE_KEY } from "@/lib/storage/keys";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { DIALOGUES_STORAGE_KEY };

export interface DialogueInput {
  content: string;
  tags: string[];
}

function normalizeDialogue(raw: unknown): Dialogue | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Dialogue> & { text?: string };

  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }

  const content =
    typeof item.content === "string"
      ? item.content
      : typeof item.text === "string"
        ? item.text
        : "";

  return {
    id: item.id,
    projectId: item.projectId,
    content,
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    isFavorite: Boolean(item.isFavorite),
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

function readLocalDialogues(): Dialogue[] {
  return readJsonArray<unknown>(DIALOGUES_STORAGE_KEY)
    .map(normalizeDialogue)
    .filter((item): item is Dialogue => item !== null);
}

function writeLocalDialogues(dialogues: Dialogue[]): void {
  writeJsonArray(DIALOGUES_STORAGE_KEY, dialogues);
}

function createDialogueId(): DialogueId {
  return crypto.randomUUID();
}

export async function readAllDialogues(): Promise<Dialogue[]> {
  if (await canUseCloudDb()) {
    try {
      const dialogues = await cloudListDialogues();
      writeLocalDialogues(dialogues);
      return dialogues;
    } catch {
      return readLocalDialogues();
    }
  }
  return readLocalDialogues();
}

export async function writeAllDialogues(dialogues: Dialogue[]): Promise<void> {
  writeLocalDialogues(dialogues);
}

export async function readDialoguesByProject(
  projectId: ProjectId,
): Promise<Dialogue[]> {
  let list: Dialogue[];

  if (await canUseCloudDb()) {
    try {
      list = await cloudListDialoguesByProject(projectId);
      const others = readLocalDialogues().filter(
        (dialogue) => dialogue.projectId !== projectId,
      );
      writeLocalDialogues([...others, ...list]);
    } catch {
      list = readLocalDialogues().filter(
        (dialogue) => dialogue.projectId === projectId,
      );
    }
  } else {
    list = readLocalDialogues().filter(
      (dialogue) => dialogue.projectId === projectId,
    );
  }

  return list.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
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
  input: DialogueInput,
): Promise<Dialogue> {
  const timestamp = nowIso();

  const dialogue: Dialogue = {
    id: createDialogueId(),
    projectId,
    content: input.content.trim(),
    tags: input.tags,
    isFavorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const local = readLocalDialogues();
  writeLocalDialogues([...local, dialogue]);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDialogue(dialogue);
    } catch {
      // 로컬 백업 유지
    }
  }

  return dialogue;
}

export async function updateDialogue(
  id: DialogueId,
  input: DialogueInput,
): Promise<Dialogue | null> {
  const all = await readAllDialogues();
  const index = all.findIndex((dialogue) => dialogue.id === id);
  if (index < 0) return null;

  const updated: Dialogue = {
    ...all[index],
    content: input.content.trim(),
    tags: input.tags,
    updatedAt: nowIso(),
  };

  const next = [...all];
  next[index] = updated;
  writeLocalDialogues(next);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDialogue(updated);
    } catch {
      // 로컬 백업 유지
    }
  }

  return updated;
}

export async function deleteDialogue(id: DialogueId): Promise<boolean> {
  const all = await readAllDialogues();
  const exists = all.some((dialogue) => dialogue.id === id);
  if (!exists) return false;

  writeLocalDialogues(all.filter((dialogue) => dialogue.id !== id));

  if (await canUseCloudDb()) {
    try {
      await cloudDeleteDialogue(id);
    } catch {
      // 로컬 백업 유지
    }
  }

  return true;
}

export async function toggleDialogueFavorite(
  id: DialogueId,
): Promise<Dialogue | null> {
  const all = await readAllDialogues();
  const index = all.findIndex((dialogue) => dialogue.id === id);
  if (index < 0) return null;

  const updated: Dialogue = {
    ...all[index],
    isFavorite: !all[index].isFavorite,
    updatedAt: nowIso(),
  };

  const next = [...all];
  next[index] = updated;
  writeLocalDialogues(next);

  if (await canUseCloudDb()) {
    try {
      await cloudUpsertDialogue(updated);
    } catch {
      // 로컬 백업 유지
    }
  }

  return updated;
}

export function filterDialogues(
  dialogues: Dialogue[],
  query: string,
): Dialogue[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return dialogues;

  return dialogues.filter((dialogue) => {
    if (dialogue.content.toLowerCase().includes(needle)) return true;
    return dialogue.tags.some((tag) => tag.toLowerCase().includes(needle));
  });
}
