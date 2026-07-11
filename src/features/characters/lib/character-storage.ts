/**
 * =============================================================================
 * Character Storage — Supabase Database 단일 소스
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { DEFAULT_CHARACTER_COLOR } from "@/features/characters/types/character";
import type { CharacterId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudDeleteCharacter,
  cloudListCharacters,
  cloudListCharactersByProject,
  cloudUpsertCharacter,
} from "@/database/supabase/characters-repo";
import { CHARACTERS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { CHARACTERS_STORAGE_KEY };

export type CharacterSortMode = "favorite" | "name" | "updated";

export interface CharacterInput {
  name: string;
  role: string;
  age: string;
  gender: string;
  occupation: string;
  personality: string;
  goal: string;
  secret: string;
  memo: string;
  image: string;
  color: string;
}

function normalizeCharacter(raw: unknown): Character | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Character> & {
    summary?: string;
    notes?: string;
  };

  if (typeof item.id !== "string" || typeof item.projectId !== "string") {
    return null;
  }
  if (typeof item.name !== "string" || !item.name.trim()) return null;

  const legacyMemo = [item.summary, item.notes]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join("\n");

  return {
    id: item.id,
    projectId: item.projectId,
    name: item.name.trim(),
    role: typeof item.role === "string" ? item.role : "",
    age: typeof item.age === "string" ? item.age : "",
    gender: typeof item.gender === "string" ? item.gender : "",
    occupation: typeof item.occupation === "string" ? item.occupation : "",
    personality:
      typeof item.personality === "string" ? item.personality : "",
    goal: typeof item.goal === "string" ? item.goal : "",
    secret: typeof item.secret === "string" ? item.secret : "",
    memo:
      typeof item.memo === "string" && item.memo.trim()
        ? item.memo
        : legacyMemo,
    image: typeof item.image === "string" ? item.image : "",
    color:
      typeof item.color === "string" && item.color
        ? item.color
        : DEFAULT_CHARACTER_COLOR,
    isFavorite: Boolean(item.isFavorite),
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : 0,
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : nowIso(),
    updatedAt:
      typeof item.updatedAt === "string" ? item.updatedAt : nowIso(),
  };
}

function readLocalCharacters(): Character[] {
  return readJsonArray<unknown>(CHARACTERS_STORAGE_KEY)
    .map(normalizeCharacter)
    .filter((item): item is Character => item !== null);
}

function writeLocalCharacters(characters: Character[]): void {
  writeJsonArray(CHARACTERS_STORAGE_KEY, characters);
}

function backupCharacters(characters: Character[]): void {
  writeWorkDataBackup(CHARACTERS_STORAGE_KEY, characters);
}

function createCharacterId(): CharacterId {
  return crypto.randomUUID();
}

export function sortCharacters(
  characters: Character[],
  mode: CharacterSortMode,
): Character[] {
  const list = [...characters];

  list.sort((a, b) => {
    if (mode === "favorite" || mode === "name" || mode === "updated") {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
    }

    if (mode === "name") {
      const byName = a.name.localeCompare(b.name, "ko");
      if (byName !== 0) return byName;
    }

    if (mode === "updated") {
      const byUpdated =
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (byUpdated !== 0) return byUpdated;
    }

    if (mode === "favorite") {
      const byUpdated =
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (byUpdated !== 0) return byUpdated;
    }

    return a.sortOrder - b.sortOrder;
  });

  return list;
}

export function filterCharactersByName(
  characters: Character[],
  query: string,
): Character[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return characters;
  return characters.filter((character) =>
    character.name.toLowerCase().includes(needle),
  );
}

export async function readAllCharacters(): Promise<Character[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const characters = await cloudListCharacters();
    backupCharacters(characters);
    return characters;
  }
  return readLocalCharacters();
}

export async function readCharactersByProject(
  projectId: ProjectId,
): Promise<Character[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListCharactersByProject(projectId);
    try {
      backupCharacters(await cloudListCharacters());
    } catch {
      // 백업 실패 무시
    }
    return sortCharacters(list, "favorite");
  }

  return sortCharacters(
    readLocalCharacters().filter(
      (character) => character.projectId === projectId,
    ),
    "favorite",
  );
}

export async function createCharacter(
  projectId: ProjectId,
  input: CharacterInput,
): Promise<Character> {
  const siblings = await readCharactersByProject(projectId);
  const maxSort = siblings.reduce(
    (max, character) => Math.max(max, character.sortOrder),
    -1,
  );
  const timestamp = nowIso();

  const character: Character = {
    id: createCharacterId(),
    projectId,
    name: input.name.trim(),
    role: input.role.trim(),
    age: input.age.trim(),
    gender: input.gender.trim(),
    occupation: input.occupation.trim(),
    personality: input.personality.trim(),
    goal: input.goal.trim(),
    secret: input.secret.trim(),
    memo: input.memo.trim(),
    image: input.image,
    color: input.color.trim() || DEFAULT_CHARACTER_COLOR,
    isFavorite: false,
    sortOrder: maxSort + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudUpsertCharacter(character);
    try {
      backupCharacters(await cloudListCharacters());
    } catch {
      // 백업 실패 무시
    }
    return character;
  }

  writeLocalCharacters([...readLocalCharacters(), character]);
  return character;
}

export async function updateCharacter(
  id: CharacterId,
  input: CharacterInput,
): Promise<Character | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListCharacters();
    const index = all.findIndex((character) => character.id === id);
    if (index < 0) return null;

    const updated: Character = {
      ...all[index],
      name: input.name.trim(),
      role: input.role.trim(),
      age: input.age.trim(),
      gender: input.gender.trim(),
      occupation: input.occupation.trim(),
      personality: input.personality.trim(),
      goal: input.goal.trim(),
      secret: input.secret.trim(),
      memo: input.memo.trim(),
      image: input.image,
      color: input.color.trim() || DEFAULT_CHARACTER_COLOR,
      updatedAt: nowIso(),
    };
    await cloudUpsertCharacter(updated);
    try {
      backupCharacters(await cloudListCharacters());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalCharacters();
  const index = all.findIndex((character) => character.id === id);
  if (index < 0) return null;
  const updated: Character = {
    ...all[index],
    name: input.name.trim(),
    role: input.role.trim(),
    age: input.age.trim(),
    gender: input.gender.trim(),
    occupation: input.occupation.trim(),
    personality: input.personality.trim(),
    goal: input.goal.trim(),
    secret: input.secret.trim(),
    memo: input.memo.trim(),
    image: input.image,
    color: input.color.trim() || DEFAULT_CHARACTER_COLOR,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalCharacters(next);
  return updated;
}

export async function deleteCharacter(id: CharacterId): Promise<boolean> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListCharacters();
    if (!all.some((character) => character.id === id)) return false;
    await cloudDeleteCharacter(id);
    try {
      backupCharacters(await cloudListCharacters());
    } catch {
      // 백업 실패 무시
    }
    return true;
  }

  const all = readLocalCharacters();
  if (!all.some((character) => character.id === id)) return false;
  writeLocalCharacters(all.filter((character) => character.id !== id));
  return true;
}

export async function toggleCharacterFavorite(
  id: CharacterId,
): Promise<Character | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const all = await cloudListCharacters();
    const index = all.findIndex((character) => character.id === id);
    if (index < 0) return null;
    const updated: Character = {
      ...all[index],
      isFavorite: !all[index].isFavorite,
      updatedAt: nowIso(),
    };
    await cloudUpsertCharacter(updated);
    try {
      backupCharacters(await cloudListCharacters());
    } catch {
      // 백업 실패 무시
    }
    return updated;
  }

  const all = readLocalCharacters();
  const index = all.findIndex((character) => character.id === id);
  if (index < 0) return null;
  const updated: Character = {
    ...all[index],
    isFavorite: !all[index].isFavorite,
    updatedAt: nowIso(),
  };
  const next = [...all];
  next[index] = updated;
  writeLocalCharacters(next);
  return updated;
}

export function pickFeaturedCharacters(
  characters: Character[],
  limit = 4,
): Character[] {
  return sortCharacters(characters, "favorite").slice(0, limit);
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }
    if (file.size > 800 * 1024) {
      reject(new Error("이미지는 800KB 이하로 올려 주세요."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("이미지를 읽지 못했습니다."));
    };
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
