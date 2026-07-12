"use client";

/**
 * =============================================================================
 * InspirationGutter
 * -----------------------------------------------------------------------------
 * 원고 본문은 바꾸지 않고, 선택 위치에 💡 아이콘만 표시한다.
 * =============================================================================
 */

import { useMemo } from "react";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import {
  stripManuscriptMarkup,
  stripManuscriptMarkupWithMap,
} from "@/features/manuscript/lib/manuscript-markup";
import { cn } from "@/lib/utils/cn";

export interface InspirationGutterProps {
  /** 에디터에 보이는 텍스트(마커 제거본) — 줄 위치 계산용 */
  content: string;
  /** 저장본(마커 포함). 없으면 content 와 동일하게 취급 */
  storageContent?: string;
  inspirations: Inspiration[];
  onOpen: (inspiration: Inspiration) => void;
  /** textarea와 맞추는 대략적 line-height (px) */
  lineHeight?: number;
  className?: string;
}

function lineIndexAtOffset(content: string, offset: number): number {
  const safe = Math.max(0, Math.min(offset, content.length));
  return content.slice(0, safe).split("\n").length - 1;
}

export function InspirationGutter({
  content,
  storageContent,
  inspirations,
  onOpen,
  lineHeight = 28,
  className,
}: InspirationGutterProps) {
  const markers = useMemo(() => {
    // 같은 줄에 여러 개면 겹치지 않게 살짝 오프셋
    const byLine = new Map<number, Inspiration[]>();
    const storage = storageContent ?? content;
    const map = stripManuscriptMarkupWithMap(storage);
    const visible = content;

    for (const item of inspirations) {
      let storageOffset = item.startOffset;
      // 본문이 바뀌어 오프셋이 어긋나면 selectedText로 재탐색 (마커 무시)
      const slicePlain = stripManuscriptMarkup(
        storage.slice(item.startOffset, item.endOffset),
      );
      if (slicePlain !== item.selectedText) {
        const found = stripManuscriptMarkup(storage).indexOf(item.selectedText);
        if (found >= 0) {
          storageOffset = map.toStorageOffset(found);
        }
      }
      const line = lineIndexAtOffset(
        visible,
        map.toVisibleOffset(storageOffset),
      );
      const list = byLine.get(line) ?? [];
      list.push(item);
      byLine.set(line, list);
    }

    const result: { inspiration: Inspiration; top: number; index: number }[] =
      [];

    for (const [line, list] of byLine) {
      list.forEach((inspiration, index) => {
        result.push({
          inspiration,
          top: line * lineHeight + 4,
          index,
        });
      });
    }

    return result;
  }, [content, storageContent, inspirations, lineHeight]);

  if (markers.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 w-8",
        className,
      )}
      aria-label="영감 표시"
    >
      {markers.map(({ inspiration, top, index }) => (
        <button
          key={inspiration.id}
          type="button"
          title={inspiration.workTitle}
          className="pointer-events-auto absolute left-0 flex h-7 w-7 items-center justify-center rounded-ns-md text-ns-sm hover:bg-ns-muted"
          style={{ top: top + index * 2 }}
          onClick={() => onOpen(inspiration)}
          aria-label={`영감: ${inspiration.workTitle}`}
        >
          💡
        </button>
      ))}
    </div>
  );
}
