"use client";

/**
 * =============================================================================
 * ProjectModal
 * -----------------------------------------------------------------------------
 * 작품 생성 / 수정 모달.
 *
 * create: 제목(필수) + 설명(선택 → Project.premise)
 * edit:   제목만 수정 (기존 설명은 유지)
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "@/features/projects/types/project";
import type { ProjectInput } from "@/features/projects/lib/project-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * create: 새 작품
   * edit: 기존 작품 수정 (project 필수)
   */
  mode: "create" | "edit";
  /** edit 모드일 때 채워 넣을 작품 */
  project?: Project | null;
  /** 저장 성공 시 호출 */
  onSubmit: (input: ProjectInput) => void;
}

export function ProjectModal({
  open,
  onClose,
  mode,
  project,
  onSubmit,
}: ProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  // 모달이 열릴 때마다 폼을 초기화한다
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && project) {
      setTitle(project.title);
      setDescription(project.premise ?? "");
    } else {
      setTitle("");
      setDescription("");
    }
    setTitleError(null);
  }, [open, mode, project]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("작품 제목을 입력해 주세요.");
      return;
    }

    onSubmit({
      title: trimmed,
      // 수정 모달은 제목만 편집 — 기존 설명 유지
      description:
        mode === "edit"
          ? (project?.premise ?? "").trim()
          : description.trim(),
    });
    // 모달은 부모에서 저장 성공 시 닫는다 (클라우드 실패 시 오류 표시)
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "작품 수정" : "새 작품"}
      description={
        isEdit
          ? "작품 제목을 수정합니다."
          : "작업실에 새 작품을 추가합니다."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="project-form">
            {isEdit ? "저장" : "만들기"}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        <Input
          label="작품 제목"
          name="title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder="예: 붉은 겨울"
          error={titleError}
          autoFocus
          required
        />

        {!isEdit ? (
          <div className="flex w-full flex-col gap-ns-2">
            <label
              htmlFor="project-description"
              className="text-ns-sm font-medium text-ns-ink"
            >
              작품 설명
            </label>
            <textarea
              id="project-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="한두 문장으로 작품을 소개해 주세요."
              rows={4}
              className={cn(
                "min-h-28 w-full resize-y rounded-ns-md px-ns-4 py-ns-3",
                "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
                "bg-ns-surface border border-ns-border",
                "transition-[border-color,box-shadow] duration-150 ease-out",
                "hover:border-ns-border-strong",
                "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
              )}
            />
            <p className="ns-caption">선택 사항입니다.</p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
