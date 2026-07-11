"use client";

/**
 * =============================================================================
 * CharacterEditor
 * -----------------------------------------------------------------------------
 * 인물 프로필 자유 에디터.
 * ManuscriptEditor · SearchBar · AutoSaveIndicator · StatisticsPanel 재사용.
 * =============================================================================
 */

import {
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
} from "react";
import type { Character } from "@/features/characters/types/character";
import { DEFAULT_CHARACTER_COLOR } from "@/features/characters/types/character";
import { readImageAsDataUrl } from "@/features/characters/lib/character-storage";
import { useCharacterEditor } from "@/features/characters/hooks/useCharacterEditor";
import { ManuscriptEditor } from "@/features/manuscript/components/ManuscriptEditor";
import { SearchBar } from "@/features/manuscript/components/SearchBar";
import { StatisticsPanel } from "@/features/manuscript/components/StatisticsPanel";
import { AutoSaveIndicator } from "@/features/manuscript/components/AutoSaveIndicator";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/lib/stats";
import { cn } from "@/lib/utils/cn";

export interface CharacterEditorProps {
  character: Character;
  onSaved?: (character: Character) => void;
  onBack?: () => void;
  className?: string;
  /** 모달 등 좁은 레이아웃에서 통계 패널 숨김 */
  compact?: boolean;
}

export function CharacterEditor({
  character,
  onSaved,
  onBack,
  className,
  compact = false,
}: CharacterEditorProps) {
  const {
    content,
    setContent,
    image,
    color,
    setMeta,
    saveStatus,
    lastSavedAt,
    displayName,
  } = useCharacterEditor(character, onSaved);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => {
    const totalChars = countCharsWithSpaces(content);
    const charsWithoutSpaces = countCharsWithoutSpaces(content);
    return {
      totalChars,
      charsWithoutSpaces,
      manuscriptSheets: estimateManuscriptSheets(charsWithoutSpaces),
      bookPages: estimateBookPages(charsWithoutSpaces),
    };
  }, [content]);

  const jumpToMatch = useCallback(
    (start: number, end: number, options?: { focus?: boolean }) => {
      const el = editorRef.current;
      if (!el) return;
      el.setSelectionRange(start, end);
      if (options?.focus !== false) el.focus();
      // 모바일/iPad: 선택 구간이 보이도록 스크롤
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
      const before = el.value.slice(0, start);
      const line = before.split("\n").length - 1;
      el.scrollTop = Math.max(0, line * lineHeight - el.clientHeight / 3);
    },
    [],
  );

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setMeta({ image: dataUrl });
    } catch {
      // 업로드 실패 시 기존 이미지 유지
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-ns-5", className)}>
      <header className="flex flex-col gap-ns-4 border-b border-ns-border pb-ns-4">
        <div className="flex flex-wrap items-start justify-between gap-ns-3">
          <div className="min-w-0 flex-1">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-ns-2 -ml-ns-2"
              >
                ← 목록
              </Button>
            ) : null}
            <p className="ns-caption mb-ns-1">인물 프로필</p>
            <h2 className="truncate text-ns-xl font-semibold text-ns-ink">
              {displayName}
            </h2>
            <AutoSaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              className="mt-ns-2"
            />
          </div>

          <div className="flex shrink-0 items-center gap-ns-3">
            <div
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-ns-lg border border-ns-border bg-ns-muted"
              style={{
                background: image
                  ? undefined
                  : `linear-gradient(135deg, ${color}33, ${color}66)`,
              }}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color || DEFAULT_CHARACTER_COLOR }}
                  aria-hidden
                />
              )}
            </div>
            <div className="flex flex-col gap-ns-2">
              <label className="inline-flex min-h-10 cursor-pointer items-center rounded-ns-md border border-ns-border bg-ns-surface px-ns-3 text-ns-sm font-medium text-ns-ink hover:bg-ns-muted">
                이미지
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleImageChange(event)}
                />
              </label>
              {image ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMeta({ image: "" })}
                >
                  제거
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-ns-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-ns-3">
            <label
              htmlFor={`character-color-${character.id}`}
              className="text-ns-sm font-medium text-ns-ink"
            >
              색상
            </label>
            <input
              id={`character-color-${character.id}`}
              type="color"
              value={color || DEFAULT_CHARACTER_COLOR}
              onChange={(event) => setMeta({ color: event.target.value })}
              className="h-10 w-12 cursor-pointer rounded-ns-md border border-ns-border bg-ns-surface p-1"
            />
            <Input
              value={color}
              onChange={(event) => setMeta({ color: event.target.value })}
              placeholder="#2563eb"
              aria-label="색상 코드"
              className="max-w-[9rem]"
            />
          </div>
          <div className="min-w-0 flex-1 sm:max-w-md">
            <SearchBar content={content} onJump={jumpToMatch} />
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-0 flex-1 gap-ns-5",
          compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_14rem]",
        )}
      >
        <ManuscriptEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          documentTitle={displayName}
          aria-label={`인물 프로필 편집: ${displayName}`}
          placeholder="인물 정보를 자유롭게 작성하세요…"
          className="min-h-[24rem] touch-manipulation md:min-h-[32rem]"
        />

        {compact ? (
          <p className="text-ns-sm text-ns-ink-tertiary tabular-nums">
            {stats.totalChars.toLocaleString()}자 · 공백 제외{" "}
            {stats.charsWithoutSpaces.toLocaleString()}자
          </p>
        ) : (
          <StatisticsPanel
            totalChars={stats.totalChars}
            charsWithoutSpaces={stats.charsWithoutSpaces}
            manuscriptSheets={stats.manuscriptSheets}
            bookPages={stats.bookPages}
            className="xl:sticky xl:top-ns-6"
          />
        )}
      </div>
    </div>
  );
}
