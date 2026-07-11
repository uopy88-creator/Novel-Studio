"use client";

/**
 * =============================================================================
 * DialogueModal → Writing Vault 추가/수정
 * -----------------------------------------------------------------------------
 * type · title · content · tags · reference
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type {
  WritingVaultEntry,
  WritingVaultType,
} from "@/features/dialogue-vault/types/dialogue";
import {
  WRITING_VAULT_TYPE_LABELS,
  WRITING_VAULT_TYPES,
} from "@/features/dialogue-vault/types/dialogue";
import {
  parseTagsInput,
  type WritingVaultInput,
} from "@/features/dialogue-vault/lib/dialogue-storage";
import { WritingVaultReferenceFields } from "@/features/dialogue-vault/components/WritingVaultReferenceFields";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface DialogueModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  dialogue?: WritingVaultEntry | null;
  /** 생성 시 기본 종류 */
  defaultType?: WritingVaultType;
  onSubmit: (input: WritingVaultInput) => void;
}

export function DialogueModal({
  open,
  onClose,
  mode,
  dialogue,
  defaultType = "sentence",
  onSubmit,
}: DialogueModalProps) {
  const [type, setType] = useState<WritingVaultType>(defaultType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [refMemo, setRefMemo] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && dialogue) {
      setType(dialogue.type);
      setTitle(dialogue.title);
      setContent(dialogue.content);
      setTagsRaw(dialogue.tags.join(", "));
      setWorkTitle(dialogue.reference.workTitle);
      setAuthor(dialogue.reference.author);
      setRefMemo(dialogue.reference.memo);
    } else {
      setType(defaultType);
      setTitle("");
      setContent("");
      setTagsRaw("");
      setWorkTitle("");
      setAuthor("");
      setRefMemo("");
    }
    setContentError(null);
  }, [open, mode, dialogue, defaultType]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setContentError("내용을 입력해 주세요.");
      return;
    }

    onSubmit({
      type,
      title,
      content: trimmed,
      tags: parseTagsInput(tagsRaw),
      reference: {
        workTitle,
        author,
        memo: refMemo,
      },
    });
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "항목 수정" : "항목 추가"}
      description={
        isEdit
          ? "종류·내용·Reference를 수정합니다."
          : "문장·단어·아이디어를 Writing Vault에 보관합니다."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="writing-vault-form">
            {isEdit ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form
        id="writing-vault-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        {/* 종류 */}
        <div className="flex flex-col gap-ns-2">
          <p className="text-ns-sm font-medium text-ns-ink">종류</p>
          <div
            className="flex flex-wrap gap-ns-1"
            role="group"
            aria-label="항목 종류"
          >
            {WRITING_VAULT_TYPES.map((option) => {
              const active = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(option)}
                  className={cn(
                    "min-h-9 rounded-ns-md px-ns-3 text-ns-sm font-medium",
                    active
                      ? "bg-ns-muted text-ns-ink"
                      : "text-ns-ink-tertiary hover:bg-ns-muted/60",
                  )}
                >
                  {WRITING_VAULT_TYPE_LABELS[option]}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="제목"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="선택"
          hint="비워 두어도 됩니다"
        />

        <div className="flex w-full flex-col gap-ns-2">
          <label
            htmlFor="writing-vault-content"
            className="text-ns-sm font-medium text-ns-ink"
          >
            내용
          </label>
          <textarea
            id="writing-vault-content"
            name="content"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (contentError) setContentError(null);
            }}
            placeholder={
              type === "word"
                ? "예: 여명"
                : type === "idea"
                  ? "예: 주인공이 이름을 잃는 설정"
                  : "예: 그래도, 나는 여기 남을게."
            }
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
          hint="쉼표 또는 공백으로 구분 · 검색에 사용됩니다"
        />

        <WritingVaultReferenceFields
          workTitle={workTitle}
          author={author}
          memo={refMemo}
          onWorkTitleChange={setWorkTitle}
          onAuthorChange={setAuthor}
          onMemoChange={setRefMemo}
        />
      </form>
    </Modal>
  );
}
