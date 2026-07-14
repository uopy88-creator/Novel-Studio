"use client";

/**
 * =============================================================================
 * InspirationGutter
 * -----------------------------------------------------------------------------
 * 원고 본문은 바꾸지 않고, 선택 위치에 💡 아이콘만 표시한다.
 * textarea 스크롤과 동기화하며, 화면 밖으로 나간 줄의 아이콘은 잘라낸다.
 * =============================================================================
 */

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import { cn } from "@/lib/utils/cn";

export interface InspirationGutterProps {
  content: string;
  inspirations: Inspiration[];
  onOpen: (inspiration: Inspiration) => void;
  /** Manuscript textarea — 스크롤·패딩·line-height 동기화 */
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  /** fallback line-height (px) — textarea 스타일을 못 읽을 때 */
  lineHeight?: number;
  className?: string;
}

function lineIndexAtOffset(content: string, offset: number): number {
  const safe = Math.max(0, Math.min(offset, content.length));
  let lines = 0;
  for (let i = 0; i < safe; i += 1) {
    if (content.charCodeAt(i) === 10) lines += 1;
  }
  return lines;
}

interface GutterMetrics {
  scrollTop: number;
  paddingTop: number;
  lineHeight: number;
  clientHeight: number;
}

export function InspirationGutter({
  content,
  inspirations,
  onOpen,
  textareaRef,
  lineHeight: lineHeightFallback = 28,
  className,
}: InspirationGutterProps) {
  const [metrics, setMetrics] = useState<GutterMetrics>({
    scrollTop: 0,
    paddingTop: 0,
    lineHeight: lineHeightFallback,
    clientHeight: 0,
  });

  // textarea 스크롤·리사이즈에 맞춰 아이콘 Y 를 다시 맞춤
  // editorRef 는 CharacterMentionField 마운트 후에 채워지므로 attach 폴링 필요
  useEffect(() => {
    let attached: HTMLTextAreaElement | null = null;
    let ro: ResizeObserver | null = null;

    const sync = (el: HTMLTextAreaElement) => {
      const style = window.getComputedStyle(el);
      const parsedLh = Number.parseFloat(style.lineHeight);
      setMetrics({
        scrollTop: el.scrollTop,
        paddingTop: Number.parseFloat(style.paddingTop) || 0,
        lineHeight:
          Number.isFinite(parsedLh) && parsedLh > 0
            ? parsedLh
            : lineHeightFallback,
        clientHeight: el.clientHeight,
      });
    };

    const onScroll = () => {
      if (attached) sync(attached);
    };

    const detach = () => {
      if (!attached) return;
      attached.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      ro = null;
      attached = null;
    };

    const attach = (el: HTMLTextAreaElement) => {
      if (attached === el) return;
      detach();
      attached = el;
      el.addEventListener("scroll", onScroll, { passive: true });
      ro = new ResizeObserver(() => sync(el));
      ro.observe(el);
      sync(el);
    };

    const timer = window.setInterval(() => {
      const el = textareaRef?.current ?? null;
      if (el) attach(el);
    }, 250);

    if (textareaRef?.current) attach(textareaRef.current);

    return () => {
      window.clearInterval(timer);
      detach();
    };
  }, [textareaRef, lineHeightFallback, content, inspirations.length]);

  const markers = useMemo(() => {
    if (inspirations.length === 0) return [];

    const byLine = new Map<number, Inspiration[]>();

    for (const item of inspirations) {
      let offset = item.startOffset;
      const slice = content.slice(item.startOffset, item.endOffset);
      if (slice !== item.selectedText) {
        const found = content.indexOf(item.selectedText);
        offset = found >= 0 ? found : item.startOffset;
      }
      const line = lineIndexAtOffset(content, offset);
      const list = byLine.get(line) ?? [];
      list.push(item);
      byLine.set(line, list);
    }

    const result: { inspiration: Inspiration; top: number; index: number }[] =
      [];

    for (const [line, list] of byLine) {
      list.forEach((inspiration, index) => {
        // 문서 좌표 → 보이는 영역 좌표 (스크롤 반영)
        const top =
          metrics.paddingTop +
          line * metrics.lineHeight +
          4 +
          index * 2 -
          metrics.scrollTop;
        result.push({ inspiration, top, index });
      });
    }

    return result;
  }, [content, inspirations, metrics]);

  // 에디터 뷰포트 밖 아이콘은 렌더하지 않음 (스크롤 내려도 남는 문제 방지)
  const visibleMarkers = useMemo(() => {
    const viewH = metrics.clientHeight || 9999;
    return markers.filter(
      (m) => m.top + 28 >= 0 && m.top <= viewH,
    );
  }, [markers, metrics.clientHeight]);

  if (visibleMarkers.length === 0) return null;

  return (
    <div
      className={cn(
        // overflow-hidden: 스크롤로 문장이 나가면 아이콘도 함께 잘림
        "pointer-events-none absolute inset-y-0 left-0 z-20 w-8 overflow-hidden",
        className,
      )}
      aria-label="영감 표시"
    >
      {visibleMarkers.map(({ inspiration, top }) => (
        <button
          key={inspiration.id}
          type="button"
          title={inspiration.workTitle}
          className="pointer-events-auto absolute left-0 flex h-7 w-7 items-center justify-center rounded-ns-md text-ns-sm hover:bg-ns-muted"
          style={{ top }}
          onClick={() => onOpen(inspiration)}
          aria-label={`영감: ${inspiration.workTitle}`}
        >
          💡
        </button>
      ))}
    </div>
  );
}
