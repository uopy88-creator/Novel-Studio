"use client";

/**
 * =============================================================================
 * InspirationPage
 * =============================================================================
 */

import { useState } from "react";
import Link from "next/link";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { ProjectId } from "@/types/ids";
import { useInspirations } from "@/features/inspiration/hooks/useInspirations";
import { InspirationList } from "@/features/inspiration/components/InspirationList";
import { InspirationToolbar } from "@/features/inspiration/components/InspirationToolbar";
import { InspirationModal } from "@/features/inspiration/components/InspirationModal";
import { InspirationDeleteDialog } from "@/features/inspiration/components/InspirationDeleteDialog";
import { ContentContainer } from "@/components/layout";
import { studioPath } from "@/components/layout/nav-items";

export interface InspirationPageProps {
  projectId: ProjectId;
}

export function InspirationPage({ projectId }: InspirationPageProps) {
  const {
    inspirations,
    filtered,
    isReady,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    update,
    remove,
  } = useInspirations(projectId);

  const [editing, setEditing] = useState<Inspiration | null>(null);
  const [deleting, setDeleting] = useState<Inspiration | null>(null);

  const isSearchEmpty =
    searchQuery.trim().length > 0 && filtered.length === 0;

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">참고</p>
          <h2 className="ns-heading">Inspiration</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            원고에서 고른 문장과 참고 작품을 연결해 둡니다.
          </p>
        </div>
        <Link
          href={studioPath(projectId, "manuscript")}
          className="inline-flex min-h-ns-touch shrink-0 items-center justify-center rounded-ns-full border border-ns-border bg-ns-surface px-ns-5 text-ns-sm font-medium text-ns-ink hover:bg-ns-muted"
        >
          Manuscript에서 추가
        </Link>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-6">
          {inspirations.length > 0 ? (
            <InspirationToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortMode={sortMode}
              onSortChange={setSortMode}
              resultCount={filtered.length}
            />
          ) : null}

          <InspirationList
            inspirations={filtered}
            isSearchEmpty={isSearchEmpty}
            onOpen={(item) => setEditing(item)}
            onDelete={(item) => setDeleting(item)}
            emptyAction={
              <Link
                href={studioPath(projectId, "manuscript")}
                className="inline-flex min-h-ns-touch items-center justify-center rounded-ns-full bg-ns-accent px-ns-5 text-ns-sm font-medium text-ns-ink-inverse hover:bg-ns-accent-hover"
              >
                Manuscript로 이동
              </Link>
            }
          />
        </div>
      )}

      <InspirationModal
        open={Boolean(editing)}
        mode="edit"
        inspiration={editing}
        onClose={() => setEditing(null)}
        onSubmit={(input) => {
          if (!editing) return;
          void update(editing.id, input);
        }}
        onDelete={() => {
          if (!editing) return;
          setDeleting(editing);
          setEditing(null);
        }}
      />

      <InspirationDeleteDialog
        open={Boolean(deleting)}
        inspiration={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(item) => {
          void remove(item.id);
        }}
      />
    </ContentContainer>
  );
}
