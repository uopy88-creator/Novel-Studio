"use client";

/**
 * =============================================================================
 * CharacterMentionField
 * -----------------------------------------------------------------------------
 * Manuscript textarea + @자동완성 + 클릭 가능한 멘션 태그.
 * PC: IME composition / caret 위치 / z-index / onSelect 동기화.
 * =============================================================================
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Character } from "@/features/characters/types/character";
import {
  filterMentionCandidates,
  findCharacterAtCursor,
  findMentionedCharacters,
  getMentionQueryAtCursor,
  insertMentionAtCursor,
} from "@/features/characters/lib/mention";
import { ManuscriptEditor } from "@/features/manuscript/components/ManuscriptEditor";
import type { HighlightRange } from "@/features/manuscript/lib/highlight-marks";
import { cn } from "@/lib/utils/cn";

export interface CharacterMentionFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 하늘색 Highlight 오버레이용 (plain 좌표) */
  highlightRanges?: readonly HighlightRange[];
  characters: Character[];
  documentTitle?: string;
  className?: string;
  /** textarea에 추가 클래스 (예: 왼쪽 여백) */
  editorClassName?: string;
  editorRef?: React.RefObject<HTMLTextAreaElement | null>;
  onOpenCharacter?: (character: Character) => void;
  /** @멘션 메뉴가 열려 있을 때 (영감 메뉴 등과 충돌 방지) */
  onMentionActiveChange?: (active: boolean) => void;
  /**
   * Manuscript 줄에 `#` 입력 후 Enter → Section 생성.
   * 성공 시 새 캐럿 오프셋을 반환한다.
   */
  onSectionBreak?: (
    cursorOffset: number,
  ) => { caretOffset: number } | null;
}

interface CaretMenuPosition {
  top: number;
  left: number;
}

function estimateCaretMenuPosition(
  el: HTMLTextAreaElement,
  mentionStart: number,
): CaretMenuPosition {
  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 28;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const rect = el.getBoundingClientRect();

  const before = el.value.slice(0, mentionStart);
  const lines = before.split("\n");
  const lineIndex = lines.length - 1;
  const col = lines[lines.length - 1]?.length ?? 0;

  const top =
    paddingTop + lineIndex * lineHeight - el.scrollTop + lineHeight + 4;
  const left = Math.min(
    paddingLeft + Math.min(col, 28) * 8 - el.scrollLeft,
    rect.width - 288,
  );

  return {
    top: Math.max(8, Math.min(top, el.clientHeight - 8)),
    left: Math.max(8, left),
  };
}

export function CharacterMentionField({
  value,
  onChange,
  highlightRanges,
  characters,
  documentTitle,
  className,
  editorClassName,
  editorRef,
  onOpenCharacter,
  onMentionActiveChange,
  onSectionBreak,
}: CharacterMentionFieldProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = editorRef ?? localRef;
  const composingRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [mention, setMention] = useState<{
    start: number;
    query: string;
    index: number;
  } | null>(null);
  const [menuPos, setMenuPos] = useState<CaretMenuPosition>({
    top: 16,
    left: 16,
  });

  const candidates = useMemo(() => {
    if (!mention) return [];
    return filterMentionCandidates(characters, mention.query);
  }, [characters, mention]);

  const mentioned = useMemo(
    () => findMentionedCharacters(value, characters),
    [value, characters],
  );

  const mentionMenuOpen = Boolean(mention && candidates.length > 0);

  useEffect(() => {
    onMentionActiveChange?.(mentionMenuOpen);
  }, [mentionMenuOpen, onMentionActiveChange]);

  const updateMenuPosition = useCallback((mentionStart: number) => {
    const el = textareaRef.current;
    if (!el) return;
    setMenuPos(estimateCaretMenuPosition(el, mentionStart));
  }, [textareaRef]);

  const syncMentionFromCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      setMention(null);
      return;
    }
    // IME 조합 중에는 쿼리 동기화를 미룬다 (조합 문자가 아직 확정 전)
    if (composingRef.current) return;

    // 범위 선택 중에는 @멘션 자동완성을 열지 않음
    // (Quick Actions / Highlight 와 충돌·비활성화 방지)
    if (el.selectionStart !== el.selectionEnd) {
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
    updateMenuPosition(found.start);
  }, [textareaRef, updateMenuPosition]);

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
    // IME 조합 중(한글 등) Arrow/Enter 는 브라우저/IME 가 처리하도록 둔다
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }

    // `#` + Enter → Section 생성 (@멘션 메뉴가 열려 있지 않을 때)
    if (
      event.key === "Enter" &&
      onSectionBreak &&
      !(mention && candidates.length > 0)
    ) {
      const el = textareaRef.current;
      if (el && el.selectionStart === el.selectionEnd) {
        const result = onSectionBreak(el.selectionStart);
        if (result) {
          event.preventDefault();
          const caret = result.caretOffset;
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(caret, caret);
          });
          return;
        }
      }
    }

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

  /** 클릭/mouseup: 완성된 `@이름` 위면 프로필 오픈, 아니면 멘션 동기화 */
  const handlePointerOpenOrSync = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // 선택 구간이 있으면 멘션/프로필 클릭으로 보지 않음
    if (el.selectionStart !== el.selectionEnd) {
      syncMentionFromCursor();
      return;
    }

    const hit = findCharacterAtCursor(
      el.value,
      el.selectionStart,
      characters,
    );
    if (hit) {
      setMention(null);
      onOpenCharacter?.(hit);
      return;
    }

    syncMentionFromCursor();
  }, [characters, onOpenCharacter, syncMentionFromCursor, textareaRef]);

  useEffect(() => {
    if (mention && mention.index >= candidates.length) {
      setMention((prev) => (prev ? { ...prev, index: 0 } : prev));
    }
  }, [candidates.length, mention]);

  useLayoutEffect(() => {
    if (mention) updateMenuPosition(mention.start);
  }, [mention, updateMenuPosition, value]);

  return (
    <div className={cn("relative flex flex-col gap-ns-3", className)}>
      <div ref={wrapperRef} className="relative">
        <ManuscriptEditor
          ref={textareaRef}
          value={value}
          highlightRanges={highlightRanges}
          onChange={(next) => {
            onChange(next);
            requestAnimationFrame(syncMentionFromCursor);
          }}
          documentTitle={documentTitle}
          className={cn("min-h-[32rem]", editorClassName)}
          onKeyDown={handleKeyDown}
          onClick={handlePointerOpenOrSync}
          onMouseUp={handlePointerOpenOrSync}
          onKeyUp={syncMentionFromCursor}
          onSelect={syncMentionFromCursor}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
            requestAnimationFrame(syncMentionFromCursor);
          }}
          onScroll={() => {
            if (mention) updateMenuPosition(mention.start);
          }}
        />

        {mentionMenuOpen ? (
          <ul
            className="absolute z-[60] max-h-72 w-[19rem] overflow-auto rounded-ns-lg border border-ns-border bg-ns-surface py-ns-1 shadow-ns-md"
            style={{ top: menuPos.top, left: menuPos.left }}
            role="listbox"
            aria-label="캐릭터 자동완성"
          >
            {candidates.map((character, index) => (
              <li key={character.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === mention!.index}
                  className={cn(
                    "flex w-full items-start gap-ns-3 px-ns-3 py-ns-2 text-left text-ns-sm",
                    index === mention!.index
                      ? "bg-ns-accent-soft text-ns-ink"
                      : "text-ns-ink-secondary hover:bg-ns-muted",
                  )}
                  onMouseDown={(event) => {
                    // textarea 포커스 유지 — 클릭으로 blur 되면 메뉴가 사라짐
                    event.preventDefault();
                    applyMention(character);
                  }}
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: character.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ns-ink">
                      {character.name}
                    </span>
                    {character.nickname ? (
                      <span className="mt-0.5 block truncate text-ns-xs text-ns-ink-tertiary">
                        별명 · {character.nickname}
                      </span>
                    ) : null}
                    {character.status ? (
                      <span className="mt-0.5 block truncate text-ns-xs text-ns-ink-tertiary">
                        {character.status}
                      </span>
                    ) : null}
                    {character.intro ? (
                      <span className="mt-0.5 block line-clamp-2 text-ns-xs text-ns-ink-tertiary">
                        {character.intro}
                      </span>
                    ) : null}
                  </span>
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
