"use client";

/**
 * =============================================================================
 * CharacterEditorModal
 * -----------------------------------------------------------------------------
 * Manuscript 등에서 인물 프로필을 크게 열어 편집한다.
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { CharacterEditor } from "@/features/characters/components/CharacterEditor";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useEffect, useId, useRef } from "react";

export interface CharacterEditorModalProps {
  open: boolean;
  character: Character | null;
  onClose: () => void;
  onSaved?: (character: Character) => void;
}

export function CharacterEditorModal({
  open,
  character,
  onClose,
  onSaved,
}: CharacterEditorModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open || !character) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-ns-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-ns-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="모달 닫기"
        className="absolute inset-0 cursor-default bg-ns-overlay"
        onClick={onClose}
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full max-w-5xl flex-col",
          "max-h-[min(94vh,56rem)] outline-none",
          "rounded-ns-xl border border-ns-border bg-ns-surface shadow-ns-lg",
        )}
      >
        <div className="flex items-center justify-between gap-ns-3 border-b border-ns-border px-ns-5 py-ns-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-ns-lg font-semibold text-ns-ink">
              Character Card
            </h2>
            <p className="mt-ns-1 truncate text-ns-sm text-ns-ink-secondary">
              {character.name}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="닫기"
            onClick={onClose}
            className="shrink-0 px-ns-3"
          >
            <span aria-hidden="true" className="text-ns-lg leading-none">
              ×
            </span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-ns-5 py-ns-5">
          <CharacterEditor
            character={character}
            onSaved={onSaved}
            compact
          />
        </div>
      </div>
    </div>
  );
}
