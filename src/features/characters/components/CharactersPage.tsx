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
import { CharacterList } from "@/features/characters/components/CharacterList";
import { CharacterFormModal } from "@/features/characters/components/CharacterFormModal";
import { CharacterToolbar } from "@/features/characters/components/CharacterToolbar";
import { CharacterDeleteDialog } from "@/features/characters/components/CharacterDeleteDialog";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; character: Character };

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
    update,
    remove,
    toggleFavorite,
  } = useCharacters(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Character | null>(null);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  const isSearchEmpty =
    searchQuery.trim().length > 0 && filtered.length === 0;

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">인물</p>
          <h2 className="ns-heading">Characters</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            작가가 계속 참고하는 인물 프로필을 모아 둡니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-ns-full px-ns-5"
        >
          + 캐릭터 추가
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
            onOpen={(character) => setModal({ type: "edit", character })}
            onDelete={(character) => setDeleting(character)}
            onToggleFavorite={(character) => {
              void toggleFavorite(character.id);
            }}
            emptyAction={
              <Button
                type="button"
                onClick={openCreate}
                className="rounded-ns-full px-ns-5"
              >
                + 캐릭터 추가
              </Button>
            }
          />
        </div>
      )}

      <CharacterFormModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        character={modal.type === "edit" ? modal.character : null}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit") {
              await update(modal.character.id, input);
            } else {
              await create(input);
            }
          })();
        }}
      />

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
