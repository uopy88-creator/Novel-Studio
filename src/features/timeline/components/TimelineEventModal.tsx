"use client";

/**
 * =============================================================================
 * TimelineEventModal — 사건 추가/수정
 * -----------------------------------------------------------------------------
 * 제목 · 설명 · 관련 Section · 관련 Character (단순 폼)
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Character } from "@/features/characters/types/character";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { TimelineEventInput } from "@/features/timeline/lib/timeline-event-storage";
import type { TimelineSceneOption } from "@/features/timeline/lib/timeline-scene-options";
import {
  decodeSceneOptionValue,
  encodeSceneOptionValue,
} from "@/features/timeline/lib/timeline-scene-options";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface TimelineEventModalProps {
  open: boolean;
  mode: "create" | "edit";
  event?: TimelineEvent | null;
  sceneOptions: TimelineSceneOption[];
  characters: Character[];
  /** Section Navigator에서 넘어온 기본 Section */
  defaultDocumentId?: string;
  defaultSceneStableId?: string;
  onClose: () => void;
  onSubmit: (input: TimelineEventInput) => void;
}

export function TimelineEventModal({
  open,
  mode,
  event,
  sceneOptions,
  characters,
  defaultDocumentId,
  defaultSceneStableId,
  onClose,
  onSubmit,
}: TimelineEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sceneValue, setSceneValue] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && event) {
      setTitle(event.title);
      setDescription(event.description);
      setSceneValue(
        event.documentId && event.sceneStableId
          ? encodeSceneOptionValue(event.documentId, event.sceneStableId)
          : "",
      );
      setCharacterId(event.characterId ?? "");
    } else {
      setTitle("");
      setDescription("");
      setSceneValue(
        defaultDocumentId && defaultSceneStableId
          ? encodeSceneOptionValue(defaultDocumentId, defaultSceneStableId)
          : "",
      );
      setCharacterId("");
    }
    setTitleError(null);
  }, [
    open,
    mode,
    event,
    defaultDocumentId,
    defaultSceneStableId,
  ]);

  const handleSubmit = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("제목을 입력하세요.");
      return;
    }

    const decoded = sceneValue ? decodeSceneOptionValue(sceneValue) : null;
    onSubmit({
      title: trimmed,
      description,
      documentId: decoded?.documentId ?? "",
      sceneStableId: decoded?.sceneStableId ?? "",
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
            value={sceneValue}
            onChange={(e) => setSceneValue(e.target.value)}
            className={cn(
              "min-h-ns-touch w-full rounded-ns-md border border-ns-border bg-ns-surface px-ns-3",
              "text-ns-sm text-ns-ink outline-none focus-visible:border-ns-accent",
            )}
          >
            <option value="">연결 안 함</option>
            {sceneOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-ns-xs text-ns-ink-tertiary">
            Section Navigator의 구간과 연결합니다.
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
