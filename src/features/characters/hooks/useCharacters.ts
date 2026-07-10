"use client";

/**
 * =============================================================================
 * useCharacters
 * -----------------------------------------------------------------------------
 * 인물 프로필 CRUD · 즐겨찾기 · 검색 · 정렬.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { CharacterId, ProjectId } from "@/types/ids";
import {
  createCharacter,
  deleteCharacter,
  filterCharactersByName,
  pickFeaturedCharacters,
  readCharactersByProject,
  sortCharacters,
  toggleCharacterFavorite,
  updateCharacter,
  type CharacterInput,
  type CharacterSortMode,
} from "@/features/characters/lib/character-storage";

export interface UseCharactersResult {
  characters: Character[];
  filtered: Character[];
  featured: Character[];
  isReady: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: CharacterSortMode;
  setSortMode: (mode: CharacterSortMode) => void;
  create: (input: CharacterInput) => Promise<Character>;
  update: (id: CharacterId, input: CharacterInput) => Promise<Character | null>;
  remove: (id: CharacterId) => Promise<boolean>;
  toggleFavorite: (id: CharacterId) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCharacters(projectId: ProjectId): UseCharactersResult {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<CharacterSortMode>("favorite");

  const refresh = useCallback(async () => {
    setCharacters(await readCharactersByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const searched = filterCharactersByName(characters, searchQuery);
    return sortCharacters(searched, sortMode);
  }, [characters, searchQuery, sortMode]);

  const featured = useMemo(
    () => pickFeaturedCharacters(characters, 4),
    [characters],
  );

  const create = useCallback(
    async (input: CharacterInput) => {
      const character = await createCharacter(projectId, input);
      setCharacters(await readCharactersByProject(projectId));
      return character;
    },
    [projectId],
  );

  const update = useCallback(
    async (id: CharacterId, input: CharacterInput) => {
      const character = await updateCharacter(id, input);
      setCharacters(await readCharactersByProject(projectId));
      return character;
    },
    [projectId],
  );

  const remove = useCallback(
    async (id: CharacterId) => {
      const ok = await deleteCharacter(id);
      setCharacters(await readCharactersByProject(projectId));
      return ok;
    },
    [projectId],
  );

  const toggleFavorite = useCallback(
    async (id: CharacterId) => {
      await toggleCharacterFavorite(id);
      setCharacters(await readCharactersByProject(projectId));
    },
    [projectId],
  );

  return {
    characters,
    filtered,
    featured,
    isReady,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    create,
    update,
    remove,
    toggleFavorite,
    refresh,
  };
}
