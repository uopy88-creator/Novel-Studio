"use client";

/**
 * =============================================================================
 * DialogueVaultPage
 * -----------------------------------------------------------------------------
 * 대사 금고 화면.
 * - 추가 / 수정 / 삭제
 * - 내용+태그 검색
 * - 즐겨찾기(⭐) 상단 고정
 * =============================================================================
 */

import { useState } from "react";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { ProjectId } from "@/types/ids";
import { useDialogues } from "@/features/dialogue-vault/hooks/useDialogues";
import { DialogueList } from "@/features/dialogue-vault/components/DialogueList";
import { DialogueModal } from "@/features/dialogue-vault/components/DialogueModal";
import { DialogueSearchBar } from "@/features/dialogue-vault/components/DialogueSearchBar";
import { DialogueDeleteDialog } from "@/features/dialogue-vault/components/DialogueDeleteDialog";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; dialogue: Dialogue };

export interface DialogueVaultPageProps {
  projectId: ProjectId;
}

export function DialogueVaultPage({ projectId }: DialogueVaultPageProps) {
  const {
    dialogues,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    create,
    update,
    remove,
    toggleFavorite,
  } = useDialogues(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Dialogue | null>(null);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  const isSearchEmpty =
    searchQuery.trim().length > 0 && filtered.length === 0;

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">보관함</p>
          <h2 className="ns-heading">Dialogue Vault</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            문득 떠오른 대사를 모아 둡니다. 원고와는 독립적으로 관리됩니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-ns-full px-ns-5"
        >
          대사 추가
        </Button>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-6">
          {dialogues.length > 0 ? (
            <DialogueSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filtered.length}
            />
          ) : null}

          <DialogueList
            dialogues={filtered}
            isSearchEmpty={isSearchEmpty}
            onEdit={(dialogue) => setModal({ type: "edit", dialogue })}
            onDelete={(dialogue) => setDeleting(dialogue)}
            onToggleFavorite={(dialogue) => {
              void toggleFavorite(dialogue.id);
            }}
            emptyAction={
              <Button
                type="button"
                onClick={openCreate}
                className="rounded-ns-full px-ns-5"
              >
                대사 추가
              </Button>
            }
          />
        </div>
      )}

      <DialogueModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        dialogue={modal.type === "edit" ? modal.dialogue : null}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit") {
              await update(modal.dialogue.id, input);
            } else {
              await create(input);
            }
          })();
        }}
      />

      <DialogueDeleteDialog
        open={Boolean(deleting)}
        dialogue={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(dialogue) => {
          void remove(dialogue.id);
        }}
      />
    </ContentContainer>
  );
}
