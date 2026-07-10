"use client";

/**
 * =============================================================================
 * DocumentModal
 * -----------------------------------------------------------------------------
 * Document 생성 / 수정 모달.
 *
 * 입력
 * - 제목 (생성 시 기본값: 새 문서)
 * - 종류: 소설 / 시 / 에세이 / 기타
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type {
  Chapter,
  DocumentKind,
} from "@/features/manuscript/types/chapter";
import {
  DEFAULT_DOCUMENT_TITLE,
  DOCUMENT_KIND_LABELS,
  DOCUMENT_KIND_OPTIONS,
} from "@/features/manuscript/types/chapter";
import type { ChapterInput } from "@/features/manuscript/lib/chapter-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  document?: Chapter | null;
  onSubmit: (input: ChapterInput) => void;
}

export function DocumentModal({
  open,
  onClose,
  mode,
  document,
  onSubmit,
}: DocumentModalProps) {
  const [title, setTitle] = useState(DEFAULT_DOCUMENT_TITLE);
  const [kind, setKind] = useState<DocumentKind>("novel");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && document) {
      setTitle(document.title);
      setKind(document.kind ?? "novel");
    } else {
      setTitle(DEFAULT_DOCUMENT_TITLE);
      setKind("novel");
    }
    setTitleError(null);
  }, [open, mode, document]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = title.trim() || DEFAULT_DOCUMENT_TITLE;

    onSubmit({
      title: trimmed,
      kind,
    });
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Document 수정" : "새 Document"}
      description={
        isEdit
          ? "제목과 종류를 수정합니다."
          : "작품에 새 문서를 추가합니다."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="document-form">
            {isEdit ? "저장" : "만들기"}
          </Button>
        </>
      }
    >
      <form
        id="document-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        <Input
          label="제목"
          name="title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder={DEFAULT_DOCUMENT_TITLE}
          error={titleError}
          autoFocus
        />

        <fieldset className="flex flex-col gap-ns-2">
          <legend className="text-ns-sm font-medium text-ns-ink">종류</legend>
          <div className="grid grid-cols-2 gap-ns-2 sm:grid-cols-4">
            {DOCUMENT_KIND_OPTIONS.map((option) => {
              const selected = kind === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKind(option)}
                  className={cn(
                    "min-h-11 rounded-ns-md border px-ns-3 text-ns-sm font-medium transition-colors",
                    selected
                      ? "border-ns-accent bg-ns-accent-soft text-ns-accent"
                      : "border-ns-border bg-ns-surface text-ns-ink-secondary hover:bg-ns-muted",
                  )}
                  aria-pressed={selected}
                >
                  {DOCUMENT_KIND_LABELS[option]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
