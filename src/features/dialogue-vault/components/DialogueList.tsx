"use client";

/**
 * =============================================================================
 * DialogueList → Writing Vault 목록
 * =============================================================================
 */

import type { ReactNode } from "react";
import type { WritingVaultEntry } from "@/features/dialogue-vault/types/dialogue";
import { DialogueCard } from "@/features/dialogue-vault/components/DialogueCard";
import { cn } from "@/lib/utils/cn";

export interface DialogueListProps {
  dialogues: WritingVaultEntry[];
  onEdit: (dialogue: WritingVaultEntry) => void;
  onDelete: (dialogue: WritingVaultEntry) => void;
  onToggleFavorite: (dialogue: WritingVaultEntry) => void;
  isSearchEmpty?: boolean;
  emptyAction?: ReactNode;
  className?: string;
}

export function DialogueList({
  dialogues,
  onEdit,
  onDelete,
  onToggleFavorite,
  isSearchEmpty = false,
  emptyAction,
  className,
}: DialogueListProps) {
  if (dialogues.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-16 text-center",
          className,
        )}
      >
        {isSearchEmpty ? (
          <>
            <p className="text-ns-lg font-medium text-ns-ink">
              검색 결과가 없습니다
            </p>
            <p className="mt-ns-2 max-w-sm text-ns-sm text-ns-ink-secondary">
              다른 단어·태그·종류로 다시 검색해 보세요.
            </p>
          </>
        ) : (
          <>
            <p className="text-ns-lg font-medium text-ns-ink">
              아직 보관된 항목이 없습니다
            </p>
            <p className="mt-ns-2 max-w-sm text-ns-sm leading-ns-relaxed text-ns-ink-secondary">
              문장·단어·아이디어를 여기에 남겨 두세요. 원고와는 따로
              관리됩니다.
            </p>
            {emptyAction ? <div className="mt-ns-6">{emptyAction}</div> : null}
          </>
        )}
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-ns-4", className)}>
      {dialogues.map((dialogue) => (
        <li key={dialogue.id}>
          <DialogueCard
            dialogue={dialogue}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  );
}
