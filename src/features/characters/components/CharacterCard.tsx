"use client";

/**
 * =============================================================================
 * CharacterCard
 * -----------------------------------------------------------------------------
 * 목록용 인물 카드 — 색상 · 이름 · 역할 · 즐겨찾기.
 * =============================================================================
 */

import type { Character } from "@/features/characters/types/character";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface CharacterCardProps {
  character: Character;
  onOpen: (character: Character) => void;
  onDelete: (character: Character) => void;
  onToggleFavorite: (character: Character) => void;
  className?: string;
}

export function CharacterCard({
  character,
  onOpen,
  onDelete,
  onToggleFavorite,
  className,
}: CharacterCardProps) {
  return (
    <Card
      variant="outlined"
      padding="none"
      className={cn(
        "overflow-hidden transition-colors hover:border-ns-border-strong",
        character.isFavorite && "border-ns-accent-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(character)}
        className="flex w-full flex-col text-left"
      >
        <div
          className="relative flex h-28 items-end bg-ns-muted px-ns-4 py-ns-3"
          style={{
            background: character.image
              ? undefined
              : `linear-gradient(135deg, ${character.color}22, ${character.color}55)`,
          }}
        >
          {character.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <span
            className="relative z-[1] inline-block h-3 w-3 rounded-full border border-white/80 shadow-ns-sm"
            style={{ backgroundColor: character.color }}
            aria-hidden
          />
        </div>

        <div className="flex flex-col gap-ns-1 px-ns-4 py-ns-4">
          <div className="flex items-start justify-between gap-ns-2">
            <h3 className="text-ns-base font-semibold text-ns-ink">
              {character.name}
            </h3>
          </div>
          <p className="text-ns-sm text-ns-ink-secondary">
            {character.role || "역할 미정"}
          </p>
          {character.occupation ? (
            <p className="text-ns-xs text-ns-ink-tertiary">
              {character.occupation}
            </p>
          ) : null}
          {character.nickname ? (
            <p className="text-ns-xs text-ns-ink-tertiary">
              별명 · {character.nickname}
            </p>
          ) : null}
          {character.status ? (
            <p className="text-ns-xs text-ns-ink-tertiary">
              {character.status}
            </p>
          ) : null}
          {character.intro ? (
            <p className="line-clamp-2 text-ns-xs text-ns-ink-tertiary">
              {character.intro}
            </p>
          ) : null}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-ns-border px-ns-2 py-ns-2">
        <button
          type="button"
          onClick={() => onToggleFavorite(character)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-ns-md text-ns-lg",
            "transition-colors hover:bg-ns-muted",
            character.isFavorite ? "text-ns-accent" : "text-ns-ink-tertiary",
          )}
          aria-label={
            character.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
          }
          aria-pressed={character.isFavorite}
        >
          {character.isFavorite ? "★" : "☆"}
        </button>
        <div className="flex gap-ns-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpen(character)}
          >
            열기
          </Button>
          <Button
            type="button"
            variant="danger-ghost"
            size="sm"
            onClick={() => onDelete(character)}
          >
            삭제
          </Button>
        </div>
      </div>
    </Card>
  );
}
