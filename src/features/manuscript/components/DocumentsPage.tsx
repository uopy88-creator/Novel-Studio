"use client";

/**
 * =============================================================================
 * DocumentsPage
 * -----------------------------------------------------------------------------
 * Project 안의 Document 목록 관리.
 * - 생성 / 수정 / 삭제
 * - 카드 클릭 → Manuscript
 * =============================================================================
 */

import { useState } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import type { ProjectId } from "@/types/ids";
import { useChapters } from "@/features/manuscript/hooks/useChapters";
import { DocumentList } from "@/features/manuscript/components/DocumentList";
import { DocumentModal } from "@/features/manuscript/components/DocumentModal";
import { DocumentDeleteDialog } from "@/features/manuscript/components/DocumentDeleteDialog";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; document: Chapter };

export interface DocumentsPageProps {
  projectId: ProjectId;
}

export function DocumentsPage({ projectId }: DocumentsPageProps) {
  const { chapters, isReady, create, update, remove, reorder } =
    useChapters(projectId);
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Chapter | null>(null);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">목차</p>
          <h2 className="ns-heading">Chapters</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            Chapter는 원고를 구분합니다. Manuscript에는 전체가 하나의 긴
            글로 이어집니다. ☰ 로 순서를 바꾸면 원고 순서도 함께 바뀝니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-ns-full px-ns-5"
        >
          새 Chapter
        </Button>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <DocumentList
          documents={chapters}
          projectId={projectId}
          onEdit={(document) => setModal({ type: "edit", document })}
          onDelete={(document) => setDeleting(document)}
          onReorder={(a, b) => {
            void reorder(a, b);
          }}
          emptyAction={
            <Button
              type="button"
              onClick={openCreate}
              className="rounded-ns-full px-ns-5"
            >
              새 Chapter
            </Button>
          }
        />
      )}

      <DocumentModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        document={modal.type === "edit" ? modal.document : null}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit") {
              await update(modal.document.id, input);
            } else {
              await create(input);
            }
          })();
        }}
      />

      <DocumentDeleteDialog
        open={Boolean(deleting)}
        document={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(document) => {
          void remove(document.id);
        }}
      />
    </ContentContainer>
  );
}
