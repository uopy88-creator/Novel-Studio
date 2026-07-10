"use client";

/**
 * =============================================================================
 * CharacterList
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { CharacterCard } from "@/features/characters/components/CharacterCard";
import type { ReactNode } from "react";

export interface CharacterListProps {
  characters: Character[];
  isSearchEmpty?: boolean;
  onOpen: (character: Character) => void;
  onDelete: (character: Character) => void;
  onToggleFavorite: (character: Character) => void;
  emptyAction?: ReactNode;
}

export function CharacterList({
  characters,
  isSearchEmpty,
  onOpen,
  onDelete,
  onToggleFavorite,
  emptyAction,
}: CharacterListProps) {
  if (characters.length === 0) {
    return (
      <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-12 text-center">
        <p className="text-ns-base font-medium text-ns-ink">
          {isSearchEmpty ? "검색 결과가 없습니다" : "아직 인물이 없습니다"}
        </p>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          {isSearchEmpty
            ? "다른 이름으로 검색해 보세요."
            : "작가가 계속 참고할 인물 프로필을 만들어 보세요."}
        </p>
        {!isSearchEmpty && emptyAction ? (
          <div className="mt-ns-6 flex justify-center">{emptyAction}</div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-ns-4 sm:grid-cols-2 lg:grid-cols-3">
      {characters.map((character) => (
        <li key={character.id}>
          <CharacterCard
            character={character}
            onOpen={onOpen}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  );
}
