"use client";

/**
 * =============================================================================
 * SectionNavigatorItem
 * -----------------------------------------------------------------------------
 * 드래그 핸들 · 접기 · 번호/제목 · 상태 · 메모 · 삭제
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Section, SectionStatus } from "@/features/manuscript/types/section";
import {
  SectionStatusDot,
  SectionStatusSelect,
} from "@/features/manuscript/components/section-navigator/SectionStatusSelect";
import { SectionMemoField } from "@/features/manuscript/components/section-navigator/SectionMemoField";
import { cn } from "@/lib/utils/cn";

export interface SectionNavigatorItemProps {
  section: Section;
  active: boolean;
  collapsed: boolean;
  onSelect: (section: Section) => void;
  onToggleCollapse: (sectionId: string) => void;
  onRename: (sectionId: string, title: string) => void;
  /** 삭제 확인 다이얼로그를 열도록 요청 */
  onDeleteRequest: (section: Section) => void;
  onStatusChange: (sectionId: string, status: SectionStatus) => void;
  onMemoChange: (sectionId: string, memo: string) => void;
  canDelete: boolean;
}

export function SectionNavigatorItem({
  section,
  active,
  collapsed,
  onSelect,
  onToggleCollapse,
  onRename,
  onDeleteRequest,
  onStatusChange,
  onMemoChange,
  canDelete,
}: SectionNavigatorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);

  useEffect(() => {
    setDraftTitle(section.title);
  }, [section.title]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function commitTitle() {
    setEditing(false);
    if (draftTitle.trim() !== section.title) {
      onRename(section.id, draftTitle);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-ns-md border border-transparent",
        active && "border-ns-accent-border bg-ns-accent-soft",
        isDragging && "z-20 opacity-90 shadow-ns-md",
      )}
    >
      <div className="flex items-start gap-ns-1 px-ns-1 py-ns-1">
        {/* 드래그 핸들 — 터치 영역 확보 (iPad) */}
        <button
          type="button"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 touch-none items-center justify-center",
            "cursor-grab rounded-ns-md text-ns-ink-tertiary",
            "hover:bg-ns-muted hover:text-ns-ink active:cursor-grabbing",
          )}
          aria-label={`${section.number}번 Section 끌기`}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="text-ns-sm leading-none">
            ⋮⋮
          </span>
        </button>

        <button
          type="button"
          className="mt-0.5 flex h-9 w-7 shrink-0 items-center justify-center rounded-ns-md text-ns-ink-tertiary hover:bg-ns-muted hover:text-ns-ink"
          aria-label={collapsed ? "Section 펼치기" : "Section 접기"}
          onClick={() => onToggleCollapse(section.id)}
        >
          <span aria-hidden className="text-ns-xs">
            {collapsed ? "▸" : "▾"}
          </span>
        </button>

        <div className="min-w-0 flex-1 py-ns-1">
          <button
            type="button"
            className="flex w-full min-w-0 flex-col items-start text-left"
            onClick={() => onSelect(section)}
          >
            <span className="flex items-center gap-1.5 text-ns-xs font-medium text-ns-ink-tertiary">
              <SectionStatusDot status={section.status} />
              #{section.number}
            </span>
            {!editing ? (
              <span
                className={cn(
                  "w-full truncate text-ns-sm font-medium text-ns-ink",
                  !section.title && "text-ns-ink-tertiary",
                )}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setEditing(true);
                }}
              >
                {section.title || "제목 없음"}
              </span>
            ) : null}
          </button>

          {editing ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setDraftTitle(section.title);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-ns-1 w-full rounded-ns-md border border-ns-border bg-ns-surface px-ns-2 py-ns-1",
                "text-ns-sm text-ns-ink outline-none focus-visible:border-ns-accent",
              )}
              placeholder="Section 제목"
              aria-label="Section 제목"
            />
          ) : null}

          {/* 접혀도 상태 칩은 보이게 — 빠른 전환 */}
          <div className="mt-ns-2" onClick={(e) => e.stopPropagation()}>
            <SectionStatusSelect
              value={section.status}
              onChange={(status) => onStatusChange(section.id, status)}
            />
          </div>

          {!collapsed ? (
            <>
              <p className="mt-ns-2 text-ns-xs text-ns-ink-tertiary">
                {section.charCount.toLocaleString()}자
                {section.body.trim() ? (
                  <span className="mt-ns-1 block line-clamp-2 break-words text-ns-ink-secondary">
                    {section.body.trim().slice(0, 80)}
                    {section.body.trim().length > 80 ? "…" : ""}
                  </span>
                ) : (
                  <span className="mt-ns-1 block text-ns-ink-tertiary">
                    (비어 있음)
                  </span>
                )}
              </p>
              <SectionMemoField
                value={section.memo}
                onChange={(memo) => onMemoChange(section.id, memo)}
              />
            </>
          ) : (
            <p className="mt-ns-1 text-ns-xs text-ns-ink-tertiary">
              {section.charCount.toLocaleString()}자
              {section.memo.trim() ? " · 메모 있음" : ""}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-ns-1 pt-0.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-ns-md text-ns-xs text-ns-ink-tertiary hover:bg-ns-muted hover:text-ns-ink"
            onClick={() => setEditing(true)}
            aria-label="제목 수정"
            title="제목 수정"
          >
            ✎
          </button>
          {canDelete ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-ns-md text-ns-xs text-ns-ink-tertiary hover:bg-ns-danger-soft hover:text-ns-danger"
              onClick={() => onDeleteRequest(section)}
              aria-label="Section 삭제"
              title="삭제"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
