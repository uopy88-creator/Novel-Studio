"use client";

/**
 * =============================================================================
 * MemoPage — 단순 Memo 목록
 * -----------------------------------------------------------------------------
 * 내용 저장 · Pin · 검색. 복잡한 분류 UI 없음.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import type { Memo } from "@/features/memo/types/memo";
import type { MemoId, ProjectId } from "@/types/ids";
import { useMemos } from "@/features/memo/hooks/useMemos";
import { MemoCard } from "@/features/memo/components/MemoCard";
import { MemoModal } from "@/features/memo/components/MemoModal";
import { MemoDeleteDialog } from "@/features/memo/components/MemoDeleteDialog";
import { useSectionRegistry } from "@/features/sections";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ContextHelp } from "@/features/help";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; memoId: MemoId };

export interface MemoPageProps {
  projectId: ProjectId;
  /** 전역 검색 딥링크 */
  initialMemoId?: string;
}

export function MemoPage({ projectId, initialMemoId }: MemoPageProps) {
  useSectionRegistry(projectId);

  const {
    memos,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    create,
    update,
    remove,
    togglePin,
  } = useMemos(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Memo | null>(null);

  useEffect(() => {
    if (!isReady || !initialMemoId) return;
    const hit = memos.find((m) => m.id === initialMemoId);
    if (hit) setModal({ type: "edit", memoId: hit.id });
  }, [isReady, initialMemoId, memos]);

  const editing = useMemo(() => {
    if (modal.type !== "edit") return null;
    return memos.find((m) => m.id === modal.memoId) ?? null;
  }, [memos, modal]);

  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-ns-6 py-ns-6">
        <header className="flex flex-wrap items-start justify-between gap-ns-4">
          <div>
            <h1 className="ns-heading">Memo</h1>
            <p className="mt-ns-1 text-ns-sm text-ns-ink-secondary">
              집필 중 떠오른 생각을 짧게 남겨 두세요.
            </p>
          </div>
          <div className="flex items-center gap-ns-2">
            <ContextHelp topic="memo" projectId={projectId} />
            <Button type="button" onClick={() => setModal({ type: "create" })}>
              새 Memo
            </Button>
          </div>
        </header>

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Memo 검색…"
          aria-label="Memo 검색"
        />

        {!isReady ? (
          <p className="text-ns-sm text-ns-ink-tertiary">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-ns-xl border border-dashed border-ns-border px-ns-6 py-ns-10 text-center">
            <p className="text-ns-sm text-ns-ink-secondary">
              {searchQuery.trim()
                ? "검색 결과가 없습니다."
                : "아직 Memo가 없습니다. 떠오른 생각을 남겨 보세요."}
            </p>
          </div>
        ) : (
          <ul className="flex list-none flex-col gap-ns-3 p-0">
            {filtered.map((memo) => (
              <li key={memo.id}>
                <MemoCard
                  projectId={projectId}
                  memo={memo}
                  onOpen={(m) => setModal({ type: "edit", memoId: m.id })}
                  onTogglePin={(m) => {
                    void togglePin(m.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <MemoModal
        open={modal.type === "create"}
        mode="create"
        onClose={() => setModal({ type: "closed" })}
        onSubmit={(input) => {
          void create(input);
        }}
      />

      <MemoModal
        open={modal.type === "edit" && Boolean(editing)}
        mode="edit"
        memo={editing}
        onClose={() => setModal({ type: "closed" })}
        onSubmit={(input) => {
          if (!editing) return;
          void update(editing.id, input);
        }}
        onDelete={() => {
          if (!editing) return;
          setDeleting(editing);
          setModal({ type: "closed" });
        }}
      />

      <MemoDeleteDialog
        open={Boolean(deleting)}
        memo={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(item) => {
          void remove(item.id);
        }}
      />
    </ContentContainer>
  );
}
