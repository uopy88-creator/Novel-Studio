"use client";

/**
 * =============================================================================
 * CharactersPage
 * =============================================================================
 */

import { useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { ProjectId } from "@/types/ids";
import { useCharacters } from "@/features/characters/hooks/useCharacters";
import { CHARACTER_CONTENT_TEMPLATE } from "@/features/characters/lib/character-template";
import { CharacterList } from "@/features/characters/components/CharacterList";
import { CharacterEditor } from "@/features/characters/components/CharacterEditor";
import { CharacterToolbar } from "@/features/characters/components/CharacterToolbar";
import { CharacterDeleteDialog } from "@/features/characters/components/CharacterDeleteDialog";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CHARACTER_COLOR } from "@/features/characters/types/character";

export interface CharactersPageProps {
  projectId: ProjectId;
}

export function CharactersPage({ projectId }: CharactersPageProps) {
  const {
    characters,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    create,
    remove,
    toggleFavorite,
    refresh,
  } = useCharacters(projectId);

  const [editing, setEditing] = useState<Character | null>(null);
  const [deleting, setDeleting] = useState<Character | null>(null);
  const [creating, setCreating] = useState(false);

  const isSearchEmpty =
    searchQuery.trim().length > 0 && filtered.length === 0;

  const openCreate = () => {
    void (async () => {
      setCreating(true);
      try {
        const character = await create({
          content: CHARACTER_CONTENT_TEMPLATE,
          image: "",
          color: DEFAULT_CHARACTER_COLOR,
          name: "새 캐릭터",
        });
        setEditing(character);
      } finally {
        setCreating(false);
      }
    })();
  };

  if (editing) {
    return (
      <ContentContainer width="wide">
        <CharacterEditor
          character={editing}
          onBack={() => {
            setEditing(null);
            void refresh();
          }}
          onSaved={(saved) => setEditing(saved)}
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">인물</p>
          <h2 className="ns-heading">Characters</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            자유 에디터로 인물 프로필을 정리합니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          disabled={creating}
          className="shrink-0 rounded-ns-full px-ns-5"
        >
          {creating ? "만드는 중…" : "+ 캐릭터 추가"}
        </Button>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-6">
          {characters.length > 0 ? (
            <CharacterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortMode={sortMode}
              onSortChange={setSortMode}
              resultCount={filtered.length}
            />
          ) : null}

          <CharacterList
            characters={filtered}
            isSearchEmpty={isSearchEmpty}
            onOpen={(character) => setEditing(character)}
            onDelete={(character) => setDeleting(character)}
            onToggleFavorite={(character) => {
              void toggleFavorite(character.id);
            }}
            emptyAction={
              <Button
                type="button"
                onClick={openCreate}
                disabled={creating}
                className="rounded-ns-full px-ns-5"
              >
                {creating ? "만드는 중…" : "+ 캐릭터 추가"}
              </Button>
            }
          />
        </div>
      )}

      <CharacterDeleteDialog
        open={Boolean(deleting)}
        character={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(character) => {
          void remove(character.id);
        }}
      />
    </ContentContainer>
  );
}
