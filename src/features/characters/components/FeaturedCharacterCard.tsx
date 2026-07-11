"use client";

/**
 * =============================================================================
 * FeaturedCharacterCard — Dashboard 미리보기
 * =============================================================================
 */

import Link from "next/link";
import type { Character } from "@/features/characters/types/character";
import { extractCharacterSubtitle } from "@/features/characters/lib/character-template";
import { studioPath } from "@/components/layout/nav-items";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface FeaturedCharacterCardProps {
  character: Character;
  projectId: string;
  className?: string;
}

export function FeaturedCharacterCard({
  character,
  projectId,
  className,
}: FeaturedCharacterCardProps) {
  return (
    <Link
      href={studioPath(projectId, "characters")}
      className={cn("block min-w-0", className)}
    >
      <Card
        variant="outlined"
        padding="none"
        className="overflow-hidden transition-colors hover:border-ns-border-strong"
      >
        <div
          className="h-16"
          style={{
            background: character.image
              ? undefined
              : `linear-gradient(135deg, ${character.color}33, ${character.color}77)`,
          }}
        >
          {character.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="px-ns-4 py-ns-3">
          <div className="flex items-center gap-ns-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: character.color }}
              aria-hidden
            />
            <p className="min-w-0 truncate text-ns-sm font-semibold text-ns-ink">
              {character.name}
            </p>
            {character.isFavorite ? (
              <span className="shrink-0 text-ns-xs text-ns-accent" aria-label="즐겨찾기">
                ★
              </span>
            ) : null}
          </div>
          <p className="mt-ns-1 truncate text-ns-xs text-ns-ink-secondary">
            {extractCharacterSubtitle(character.content) ||
              character.role ||
              "프로필"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
