"use client";

/**
 * =============================================================================
 * DialogueModal
 * -----------------------------------------------------------------------------
 * 대사 추가 / 수정.
 *
 * 입력
 * - 대사 (content)
 * - 태그 (쉼표 또는 공백으로 구분)
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import {
  parseTagsInput,
  type DialogueInput,
} from "@/features/dialogue-vault/lib/dialogue-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface DialogueModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  dialogue?: Dialogue | null;
  onSubmit: (input: DialogueInput) => void;
}

export function DialogueModal({
  open,
  onClose,
  mode,
  dialogue,
  onSubmit,
}: DialogueModalProps) {
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && dialogue) {
      setContent(dialogue.content);
      setTagsRaw(dialogue.tags.join(", "));
    } else {
      setContent("");
      setTagsRaw("");
    }
    setContentError(null);
  }, [open, mode, dialogue]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setContentError("대사를 입력해 주세요.");
      return;
    }

    onSubmit({
      content: trimmed,
      tags: parseTagsInput(tagsRaw),
    });
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "대사 수정" : "대사 추가"}
      description={
        isEdit
          ? "대사와 태그를 수정합니다."
          : "문득 떠오른 한 줄을 금고에 넣습니다."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="dialogue-form">
            {isEdit ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form
        id="dialogue-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        <div className="flex w-full flex-col gap-ns-2">
          <label
            htmlFor="dialogue-content"
            className="text-ns-sm font-medium text-ns-ink"
          >
            대사
          </label>
          <textarea
            id="dialogue-content"
            name="content"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (contentError) setContentError(null);
            }}
            placeholder="예: 그래도, 나는 여기 남을게."
            rows={5}
            autoFocus
            className={cn(
              "min-h-32 w-full resize-y rounded-ns-md px-ns-4 py-ns-3",
              "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
              "bg-ns-surface border border-ns-border",
              "transition-[border-color,box-shadow] duration-150 ease-out",
              "hover:border-ns-border-strong",
              "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
              contentError && "border-ns-danger",
            )}
          />
          {contentError ? (
            <p className="text-ns-sm text-ns-danger" role="alert">
              {contentError}
            </p>
          ) : (
            <p className="ns-caption">원고와는 따로 보관됩니다.</p>
          )}
        </div>

        <Input
          label="태그"
          name="tags"
          value={tagsRaw}
          onChange={(event) => setTagsRaw(event.target.value)}
          placeholder="유머, 반전, 1권"
          hint="쉼표 또는 공백으로 구분합니다"
        />
      </form>
    </Modal>
  );
}
