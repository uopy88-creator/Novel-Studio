"use client";

/**
 * =============================================================================
 * TimelineEventModal — 사건 추가/수정
 * -----------------------------------------------------------------------------
 * 제목 · 설명 · 관련 Section · 관련 Character
 * Section 목록은 primary Manuscript 기준 (구 Chapter 제외).
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Character } from "@/features/characters/types/character";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { TimelineEventInput } from "@/features/timeline/lib/timeline-event-storage";
import type { TimelineSectionOption } from "@/features/timeline/lib/timeline-section-options";
import {
  decodeSectionOptionValue,
} from "@/features/timeline/lib/timeline-section-options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface TimelineEventModalProps {
  open: boolean;
  mode: "create" | "edit";
  event?: TimelineEvent | null;
  sectionOptions: TimelineSectionOption[];
  characters: Character[];
  /** Section 페이지에서 넘어온 기본 Section */
  defaultDocumentId?: string;
  defaultSectionStableId?: string;
  onClose: () => void;
  onSubmit: (input: TimelineEventInput) => void;
}

export function TimelineEventModal({
  open,
  mode,
  event,
  sectionOptions,
  characters,
  defaultDocumentId,
  defaultSectionStableId,
  onClose,
  onSubmit,
}: TimelineEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionValue, setSectionValue] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && event) {
      setTitle(event.title);
      setDescription(event.description);
      setSectionValue(event.sectionStableId ?? "");
      setCharacterId(event.characterId ?? "");
    } else {
      setTitle("");
      setDescription("");
      // default 가 현재 옵션에 있을 때만 미리 선택
      const defaultId = defaultSectionStableId ?? "";
      const exists = sectionOptions.some(
        (o) => o.sectionStableId === defaultId,
      );
      setSectionValue(exists ? defaultId : "");
      setCharacterId("");
    }
    setTitleError(null);
  }, [
    open,
    mode,
    event,
    defaultDocumentId,
    defaultSectionStableId,
    sectionOptions,
  ]);

  const handleSubmit = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("제목을 입력하세요.");
      return;
    }

    const decoded = sectionValue
      ? decodeSectionOptionValue(sectionValue)
      : null;
    const sectionStableId = decoded?.sectionStableId ?? "";
    const matched = sectionOptions.find(
      (o) => o.sectionStableId === sectionStableId,
    );

    onSubmit({
      title: trimmed,
      description,
      // 항상 primary document (옵션에 담긴 id)
      documentId: matched?.documentId ?? defaultDocumentId ?? "",
      sectionStableId,
      characterId: characterId || "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "사건 추가" : "사건 수정"}
      description="연표가 아니라, 이야기 속 사건을 시간순으로 적습니다."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="timeline-event-form">
            저장
          </Button>
        </>
      }
    >
      <form
        id="timeline-event-form"
        className="flex flex-col gap-ns-4"
        onSubmit={handleSubmit}
      >
        <Input
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 첫 만남"
          error={titleError ?? undefined}
          autoFocus
        />

        <label className="flex flex-col gap-ns-1">
          <span className="text-ns-sm font-medium text-ns-ink">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="짧은 메모"
            className={cn(
              "min-h-[5rem] w-full rounded-ns-md border border-ns-border bg-ns-surface px-ns-3 py-ns-2",
              "text-ns-sm text-ns-ink outline-none focus-visible:border-ns-accent",
            )}
          />
        </label>

        <label className="flex flex-col gap-ns-1">
          <span className="text-ns-sm font-medium text-ns-ink">
            관련 Section
          </span>
          <select
            value={sectionValue}
            onChange={(e) => setSectionValue(e.target.value)}
            className={cn(
              "min-h-ns-touch w-full rounded-ns-md border border-ns-border bg-ns-surface px-ns-3",
              "text-ns-sm text-ns-ink outline-none focus-visible:border-ns-accent",
            )}
          >
            <option value="">연결 안 함</option>
            {sectionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-ns-xs text-ns-ink-tertiary">
            Manuscript의 Section과 연결합니다. (구 Chapter는 표시되지 않습니다)
          </span>
        </label>

        <label className="flex flex-col gap-ns-1">
          <span className="text-ns-sm font-medium text-ns-ink">
            관련 Character
          </span>
          <select
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            className={cn(
              "min-h-ns-touch w-full rounded-ns-md border border-ns-border bg-ns-surface px-ns-3",
              "text-ns-sm text-ns-ink outline-none focus-visible:border-ns-accent",
            )}
          >
            <option value="">연결 안 함</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "이름 없음"}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
