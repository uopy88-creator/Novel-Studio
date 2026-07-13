"use client";

/**
 * =============================================================================
 * CharactersPage
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { CharacterId, ProjectId } from "@/types/ids";
import { useCharacters } from "@/features/characters/hooks/useCharacters";
import { CharacterList } from "@/features/characters/components/CharacterList";
import { CharacterFormModal } from "@/features/characters/components/CharacterFormModal";
import { CharacterToolbar } from "@/features/characters/components/CharacterToolbar";
import { CharacterDeleteDialog } from "@/features/characters/components/CharacterDeleteDialog";
import { replaceMentionNameInText } from "@/features/characters/lib/mention";
import {
  loadProjectManuscript,
  saveProjectManuscript,
} from "@/features/manuscript/lib/project-manuscript";
import { getSectionRegistrySnapshot, useSectionRegistry } from "@/features/sections";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { ContextHelp } from "@/features/help";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; characterId: CharacterId };

export interface CharactersPageProps {
  projectId: ProjectId;
  /** 전역 검색에서 전달 — 해당 캐릭터 편집 모달 오픈 */
  initialCharacterId?: string;
}

async function syncMentionNamesInManuscript(
  projectId: ProjectId,
  oldName: string,
  newName: string,
): Promise<void> {
  if (!oldName.trim() || oldName.trim() === newName.trim()) return;

  // Section 목록은 Registry 가 SSOT — 여기서는 원고 본문만 수정한다.
  const registry = getSectionRegistrySnapshot(projectId);

  const { chapters, content, primaryDocumentId } =
    await loadProjectManuscript(projectId);
  const next = replaceMentionNameInText(content, oldName, newName);
  if (next === content) return;

  await saveProjectManuscript({
    projectId,
    chapters,
    content: next,
    primaryDocumentId: registry.primaryDocumentId ?? primaryDocumentId,
  });
}

export function CharactersPage({
  projectId,
  initialCharacterId,
}: CharactersPageProps) {
  // Section Registry 구독 — 제목/순서 변경 시 동일 SSOT 로 즉시 반영 가능
  useSectionRegistry(projectId);

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

  // 전역 검색 딥링크 — 준비되면 해당 캐릭터 편집 모달
  useEffect(() => {
    if (!isReady || !initialCharacterId) return;
    const hit = characters.find((c) => c.id === initialCharacterId);
    if (hit) setModal({ type: "edit", characterId: hit.id });
  }, [isReady, initialCharacterId, characters]);

  const editingCharacter = useMemo(() => {
    if (modal.type !== "edit") return null;
    return characters.find((c) => c.id === modal.characterId) ?? null;
  }, [characters, modal]);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  const isSearchEmpty =
    searchQuery.trim().length > 0 && filtered.length === 0;

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">인물</p>
          <h2 className="ns-heading">Characters</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            작가가 계속 참고하는 인물 프로필을 모아 둡니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-ns-2">
          <ContextHelp topic="character" projectId={projectId} />
          <Button
            type="button"
            onClick={openCreate}
            className="rounded-ns-full px-ns-5"
          >
            + 캐릭터 추가
          </Button>
        </div>
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
            onOpen={(character) =>
              setModal({ type: "edit", characterId: character.id })
            }
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
        character={editingCharacter}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit" && editingCharacter) {
              const oldName = editingCharacter.name;
              await update(editingCharacter.id, input);
              await syncMentionNamesInManuscript(
                projectId,
                oldName,
                input.name,
              );
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
