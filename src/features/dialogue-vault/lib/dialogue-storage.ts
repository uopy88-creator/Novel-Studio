/**
 * =============================================================================
 * Dialogue LocalStorage
 * -----------------------------------------------------------------------------
 * 키: novel-studio:dialogues
 * 원고와 독립 — Manuscript / Document 를 수정하지 않는다.
 * =============================================================================
 */

import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { DialogueId, ProjectId } from "@/types/ids";

export const DIALOGUES_STORAGE_KEY = "novel-studio:dialogues";

/** 생성/수정 폼 입력 */
export interface DialogueInput {
  content: string;
  /** 쉼표 또는 공백으로 구분된 태그 문자열도 허용하기 전, 이미 파싱된 배열 */
  tags: string[];
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * 구버전(text 필드) / 신버전(content) 모두 읽는다.
 */
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

export function readAllDialogues(): Dialogue[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(DIALOGUES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDialogue)
      .filter((item): item is Dialogue => item !== null);
  } catch {
    return [];
  }
}

export function writeAllDialogues(dialogues: Dialogue[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    DIALOGUES_STORAGE_KEY,
    JSON.stringify(dialogues),
  );
}

/**
 * 작품별 목록.
 * 즐겨찾기 먼저, 그다음 updatedAt 최신순.
 */
export function readDialoguesByProject(projectId: ProjectId): Dialogue[] {
  return readAllDialogues()
    .filter((dialogue) => dialogue.projectId === projectId)
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
}

function createDialogueId(): DialogueId {
  return crypto.randomUUID();
}

/** 태그 문자열 → 배열 (쉼표/공백 구분, 중복 제거) */
export function parseTagsInput(raw: string): string[] {
  const parts = raw
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

export function createDialogue(
  projectId: ProjectId,
  input: DialogueInput,
): Dialogue {
  const all = readAllDialogues();
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

  writeAllDialogues([...all, dialogue]);
  return dialogue;
}

export function updateDialogue(
  id: DialogueId,
  input: DialogueInput,
): Dialogue | null {
  const all = readAllDialogues();
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
  writeAllDialogues(next);
  return updated;
}

export function deleteDialogue(id: DialogueId): boolean {
  const all = readAllDialogues();
  const next = all.filter((dialogue) => dialogue.id !== id);
  if (next.length === all.length) return false;
  writeAllDialogues(next);
  return true;
}

/** 즐겨찾기 토글 — true면 목록 상단 고정 */
export function toggleDialogueFavorite(id: DialogueId): Dialogue | null {
  const all = readAllDialogues();
  const index = all.findIndex((dialogue) => dialogue.id === id);
  if (index < 0) return null;

  const updated: Dialogue = {
    ...all[index],
    isFavorite: !all[index].isFavorite,
    updatedAt: nowIso(),
  };

  const next = [...all];
  next[index] = updated;
  writeAllDialogues(next);
  return updated;
}

/**
 * 대사 내용 + 태그를 동시에 검색 (대소문자 무시).
 * query가 비어 있으면 원본 목록을 그대로 반환.
 */
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
