"use client";

/**
 * =============================================================================
 * DialogueVaultPage → Writing Vault
 * -----------------------------------------------------------------------------
 * 문장 · 단어 · 아이디어 통합 금고
 * - 추가 / 수정 / 삭제
 * - 검색 · 태그 검색 · 종류 필터
 * - 즐겨찾기 · Reference
 * =============================================================================
 */

import { useMemo, useState } from "react";
import type { WritingVaultEntry } from "@/features/dialogue-vault/types/dialogue";
import type { ProjectId } from "@/types/ids";
import { useDialogues } from "@/features/dialogue-vault/hooks/useDialogues";
import { DialogueList } from "@/features/dialogue-vault/components/DialogueList";
import { DialogueModal } from "@/features/dialogue-vault/components/DialogueModal";
import { DialogueSearchBar } from "@/features/dialogue-vault/components/DialogueSearchBar";
import { DialogueDeleteDialog } from "@/features/dialogue-vault/components/DialogueDeleteDialog";
import { WritingVaultTypeFilter } from "@/features/dialogue-vault/components/WritingVaultTypeFilter";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; dialogue: WritingVaultEntry };

export interface DialogueVaultPageProps {
  projectId: ProjectId;
}

/** Writing Vault 페이지 (파일명·export 는 하위 호환 유지) */
export function DialogueVaultPage({ projectId }: DialogueVaultPageProps) {
  const {
    dialogues,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    create,
    update,
    remove,
    toggleFavorite,
  } = useDialogues(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<WritingVaultEntry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  const isSearchEmpty =
    (searchQuery.trim().length > 0 || typeFilter !== "all") &&
    filtered.length === 0 &&
    dialogues.length > 0;

  const typeCounts = useMemo(() => {
    const counts = {
      all: dialogues.length,
      sentence: 0,
      word: 0,
      idea: 0,
    };
    for (const entry of dialogues) {
      counts[entry.type] += 1;
    }
    return counts;
  }, [dialogues]);

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">보관함</p>
          <h2 className="ns-heading">Writing Vault</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            문장·단어·아이디어를 한곳에서 모읍니다. 원고와는 독립적으로
            관리됩니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-ns-full px-ns-5"
        >
          항목 추가
        </Button>
      </header>

      {actionError ? (
        <p className="mb-ns-4 text-ns-sm text-ns-danger" role="alert">
          {actionError}
        </p>
      ) : null}

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-6">
          {dialogues.length > 0 ? (
            <div className="flex flex-col gap-ns-4">
              <WritingVaultTypeFilter
                value={typeFilter}
                onChange={setTypeFilter}
                counts={typeCounts}
              />
              <DialogueSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={filtered.length}
              />
            </div>
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
                항목 추가
              </Button>
            }
          />
        </div>
      )}

      <DialogueModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        dialogue={modal.type === "edit" ? modal.dialogue : null}
        defaultType={typeFilter === "all" ? "sentence" : typeFilter}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            try {
              setActionError(null);
              if (modal.type === "edit") {
                await update(modal.dialogue.id, input);
              } else {
                await create(input);
              }
            } catch (error) {
              setActionError(
                error instanceof Error
                  ? error.message
                  : "클라우드 저장에 실패했습니다.",
              );
            }
          })();
        }}
      />

      <DialogueDeleteDialog
        open={Boolean(deleting)}
        dialogue={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(dialogue) => {
          void (async () => {
            try {
              setActionError(null);
              await remove(dialogue.id);
            } catch (error) {
              setActionError(
                error instanceof Error
                  ? error.message
                  : "클라우드 삭제에 실패했습니다.",
              );
            }
          })();
        }}
      />
    </ContentContainer>
  );
}

/** 명시적 Writing Vault 별칭 */
export const WritingVaultPage = DialogueVaultPage;
