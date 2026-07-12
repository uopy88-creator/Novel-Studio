"use client";

/**
 * =============================================================================
 * DocumentModal
 * -----------------------------------------------------------------------------
 * Document / Chapter 생성 · 수정 모달.
 * 제목만 입력한다. 작품 종류는 Project 속성이다.
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Chapter } from "@/features/manuscript/types/chapter";
import { DEFAULT_DOCUMENT_TITLE } from "@/features/manuscript/types/chapter";
import type { ChapterInput } from "@/features/manuscript/lib/chapter-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

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
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && document) {
      setTitle(document.title);
    } else {
      setTitle(DEFAULT_DOCUMENT_TITLE);
    }
    setTitleError(null);
  }, [open, mode, document]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = title.trim() || DEFAULT_DOCUMENT_TITLE;

    onSubmit({
      title: trimmed,
      // 종류 UI 제거 — 생성 시 novel, 수정 시 기존 값 유지
      kind: mode === "edit" ? (document?.kind ?? "novel") : "novel",
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
        isEdit ? "문서 제목을 수정합니다." : "작품에 새 문서를 추가합니다."
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
      </form>
    </Modal>
  );
}
