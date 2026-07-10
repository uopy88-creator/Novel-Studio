"use client";

/**
 * =============================================================================
 * CharacterMentionField
 * -----------------------------------------------------------------------------
 * Manuscript textarea + @자동완성 + 클릭 가능한 멘션 태그.
 * =============================================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Character } from "@/features/characters/types/character";
import {
  filterMentionCandidates,
  findMentionedCharacters,
  getMentionQueryAtCursor,
  insertMentionAtCursor,
} from "@/features/characters/lib/mention";
import { ManuscriptEditor } from "@/features/manuscript/components/ManuscriptEditor";
import { cn } from "@/lib/utils/cn";

export interface CharacterMentionFieldProps {
  value: string;
  onChange: (value: string) => void;
  characters: Character[];
  documentTitle?: string;
  className?: string;
  /** textarea에 추가 클래스 (예: 왼쪽 여백) */
  editorClassName?: string;
  editorRef?: React.RefObject<HTMLTextAreaElement | null>;
  onOpenCharacter?: (character: Character) => void;
}

export function CharacterMentionField({
  value,
  onChange,
  characters,
  documentTitle,
  className,
  editorClassName,
  editorRef,
  onOpenCharacter,
}: CharacterMentionFieldProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = editorRef ?? localRef;

  const [mention, setMention] = useState<{
    start: number;
    query: string;
    index: number;
  } | null>(null);

  const candidates = useMemo(() => {
    if (!mention) return [];
    return filterMentionCandidates(characters, mention.query);
  }, [characters, mention]);

  const mentioned = useMemo(
    () => findMentionedCharacters(value, characters),
    [value, characters],
  );

  const syncMentionFromCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      setMention(null);
      return;
    }
    const found = getMentionQueryAtCursor(el.value, el.selectionStart);
    if (!found) {
      setMention(null);
      return;
    }
    setMention((prev) => ({
      start: found.start,
      query: found.query,
      index: prev?.query === found.query ? prev.index : 0,
    }));
  }, [textareaRef]);

  const applyMention = useCallback(
    (character: Character) => {
      const el = textareaRef.current;
      if (!el || !mention) return;

      const { nextText, nextCursor } = insertMentionAtCursor({
        text: el.value,
        cursor: el.selectionStart,
        mentionStart: mention.start,
        name: character.name,
      });

      onChange(nextText);
      setMention(null);

      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [mention, onChange, textareaRef],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention || candidates.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMention((prev) =>
        prev
          ? {
              ...prev,
              index: (prev.index + 1) % candidates.length,
            }
          : prev,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMention((prev) =>
        prev
          ? {
              ...prev,
              index:
                (prev.index - 1 + candidates.length) % candidates.length,
            }
          : prev,
      );
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selected = candidates[mention.index] ?? candidates[0];
      if (selected) applyMention(selected);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setMention(null);
    }
  };

  useEffect(() => {
    if (mention && mention.index >= candidates.length) {
      setMention((prev) => (prev ? { ...prev, index: 0 } : prev));
    }
  }, [candidates.length, mention]);

  return (
    <div className={cn("relative flex flex-col gap-ns-3", className)}>
      <div className="relative">
        <ManuscriptEditor
          ref={textareaRef}
          value={value}
          onChange={(next) => {
            onChange(next);
            requestAnimationFrame(syncMentionFromCursor);
          }}
          documentTitle={documentTitle}
          className={cn("min-h-[32rem]", editorClassName)}
          onKeyDown={handleKeyDown}
          onClick={syncMentionFromCursor}
          onKeyUp={syncMentionFromCursor}
        />

        {mention && candidates.length > 0 ? (
          <ul
            className="absolute left-ns-4 top-ns-4 z-20 max-h-56 w-64 overflow-auto rounded-ns-lg border border-ns-border bg-ns-surface py-ns-1 shadow-ns-md"
            role="listbox"
            aria-label="캐릭터 자동완성"
          >
            {candidates.map((character, index) => (
              <li key={character.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === mention.index}
                  className={cn(
                    "flex w-full items-center gap-ns-3 px-ns-3 py-ns-2 text-left text-ns-sm",
                    index === mention.index
                      ? "bg-ns-accent-soft text-ns-ink"
                      : "text-ns-ink-secondary hover:bg-ns-muted",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyMention(character);
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: character.color }}
                    aria-hidden
                  />
                  <span className="truncate font-medium">{character.name}</span>
                  {character.role ? (
                    <span className="truncate text-ns-xs text-ns-ink-tertiary">
                      {character.role}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* 클릭 가능한 멘션 태그 */}
      {mentioned.length > 0 ? (
        <div className="flex flex-wrap items-center gap-ns-2">
          <span className="text-ns-xs font-medium text-ns-ink-tertiary">
            언급된 인물
          </span>
          {mentioned.map((character) => (
            <button
              key={character.id}
              type="button"
              onClick={() => onOpenCharacter?.(character)}
              className={cn(
                "inline-flex items-center gap-ns-2 rounded-ns-full border border-ns-border",
                "bg-ns-surface px-ns-3 py-ns-1 text-ns-xs font-medium text-ns-ink",
                "transition-colors hover:border-ns-accent hover:bg-ns-accent-soft",
              )}
              style={{ borderColor: `${character.color}66` }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: character.color }}
                aria-hidden
              />
              @{character.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-ns-xs text-ns-ink-tertiary">
          `@` 를 입력하면 캐릭터 이름이 자동완성됩니다.
        </p>
      )}
    </div>
  );
}
