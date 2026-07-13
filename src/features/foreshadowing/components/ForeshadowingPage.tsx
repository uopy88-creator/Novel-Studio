"use client";

/**
 * =============================================================================
 * ForeshadowingPage
 * -----------------------------------------------------------------------------
 * 복선 관리 페이지 — 목록 · 필터 · 검색 · 정렬 · 생성/수정/삭제.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingId, ProjectId } from "@/types/ids";
import { useForeshadowings } from "@/features/foreshadowing/hooks/useForeshadowings";
import { ForeshadowingList } from "@/features/foreshadowing/components/ForeshadowingList";
import { ForeshadowingToolbar } from "@/features/foreshadowing/components/ForeshadowingToolbar";
import { ForeshadowingFormModal } from "@/features/foreshadowing/components/ForeshadowingFormModal";
import { ForeshadowingDeleteDialog } from "@/features/foreshadowing/components/ForeshadowingDeleteDialog";
import { useSectionRegistry } from "@/features/sections";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { ContextHelp } from "@/features/help";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; foreshadowingId: ForeshadowingId };

export interface ForeshadowingPageProps {
  projectId: ProjectId;
  /** 전역 검색에서 전달 — 해당 복선 편집 모달 오픈 */
  initialForeshadowingId?: string;
}

export function ForeshadowingPage({
  projectId,
  initialForeshadowingId,
}: ForeshadowingPageProps) {
  // Section Registry 구독 — planted/payoff Section 라벨이 제목 변경 시 즉시 갱신
  useSectionRegistry(projectId);

  const {
    items,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortMode,
    setSortMode,
    statusCounts,
    create,
    update,
    remove,
  } = useForeshadowings(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Foreshadowing | null>(null);

  // 전역 검색 딥링크 — 준비되면 해당 복선 편집 모달
  useEffect(() => {
    if (!isReady || !initialForeshadowingId) return;
    const hit = items.find((f) => f.id === initialForeshadowingId);
    if (hit) setModal({ type: "edit", foreshadowingId: hit.id });
  }, [isReady, initialForeshadowingId, items]);

  const editingItem = useMemo(() => {
    if (modal.type !== "edit") return null;
    return items.find((f) => f.id === modal.foreshadowingId) ?? null;
  }, [items, modal]);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  // 검색어 또는 상태 필터로 결과가 비었는지
  const isFilterEmpty =
    filtered.length === 0 &&
    (searchQuery.trim().length > 0 || statusFilter !== "all");

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">복선</p>
          <h2 className="ns-heading">Foreshadowing</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            심어 둔 복선과 회수할 약속을 직접 기록하고 관리합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-ns-2">
          <ContextHelp topic="foreshadowing" projectId={projectId} />
          <Button
            type="button"
            onClick={openCreate}
            className="rounded-ns-full px-ns-5"
          >
            + 새 복선
          </Button>
        </div>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-6">
          {items.length > 0 ? (
            <ForeshadowingToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
              sortMode={sortMode}
              onSortChange={setSortMode}
              resultCount={filtered.length}
            />
          ) : null}

          <ForeshadowingList
            items={filtered}
            isFilterEmpty={isFilterEmpty}
            onEdit={(item) =>
              setModal({ type: "edit", foreshadowingId: item.id })
            }
            onDelete={(item) => setDeleting(item)}
            emptyAction={
              <Button
                type="button"
                onClick={openCreate}
                className="rounded-ns-full px-ns-5"
              >
                + 새 복선
              </Button>
            }
          />
        </div>
      )}

      <ForeshadowingFormModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        foreshadowing={editingItem}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit" && editingItem) {
              await update(editingItem.id, input);
            } else {
              await create(input);
            }
          })();
        }}
      />

      <ForeshadowingDeleteDialog
        open={Boolean(deleting)}
        foreshadowing={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(item) => {
          void remove(item.id);
        }}
      />
    </ContentContainer>
  );
}
