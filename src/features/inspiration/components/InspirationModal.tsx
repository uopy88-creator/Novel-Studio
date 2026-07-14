"use client";

/**
 * =============================================================================
 * InspirationModal — 영감 추가 / 수정
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { InspirationInput } from "@/features/inspiration/lib/inspiration-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface InspirationModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** 생성 시 선택된 문장 (읽기 전용 표시) */
  selectedText?: string;
  inspiration?: Inspiration | null;
  onSubmit: (input: InspirationInput) => void | Promise<void>;
  /** 수정 모드에서 삭제 */
  onDelete?: () => void;
}

export function InspirationModal({
  open,
  onClose,
  mode,
  selectedText,
  inspiration,
  onSubmit,
  onDelete,
}: InspirationModalProps) {
  const [workTitle, setWorkTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [memo, setMemo] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const displayText =
    mode === "edit" && inspiration
      ? inspiration.selectedText
      : selectedText ?? "";

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && inspiration) {
      setWorkTitle(inspiration.workTitle);
      setAuthor(inspiration.author);
      setMemo(inspiration.memo);
    } else {
      setWorkTitle("");
      setAuthor("");
      setMemo("");
    }
    setTitleError(null);
    setSaveError(null);
    setSaving(false);
  }, [open, mode, inspiration]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!workTitle.trim()) {
      setTitleError("작품명을 입력해 주세요.");
      return;
    }

    void (async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await onSubmit({
          workTitle: workTitle.trim(),
          author: author.trim(),
          memo: memo.trim(),
        });
        onClose();
      } catch (err) {
        setSaveError(
          err instanceof Error
            ? err.message
            : "Inspiration을 저장하지 못했습니다.",
        );
      } finally {
        setSaving(false);
      }
    })();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "영감 노트" : "💡 영감 추가"}
      description={
        isEdit
          ? "참고한 작품과 메모를 수정합니다."
          : "선택한 문장에 참고 작품을 연결합니다."
      }
      size="md"
      footer={
        <>
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="danger-ghost"
              className="mr-auto"
              disabled={saving}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              삭제
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </Button>
          <Button type="submit" form="inspiration-form" disabled={saving}>
            {saving ? "저장 중…" : isEdit ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form
        id="inspiration-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        {saveError ? (
          <p className="text-ns-sm text-ns-danger" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="rounded-ns-md border border-ns-border bg-ns-muted/50 px-ns-4 py-ns-3">
          <p className="mb-ns-1 text-ns-xs font-medium text-ns-ink-tertiary">
            선택한 문장
          </p>
          <p className="whitespace-pre-wrap text-ns-sm leading-ns-relaxed text-ns-ink">
            {displayText || "—"}
          </p>
        </div>

        <Input
          label="작품명"
          value={workTitle}
          onChange={(event) => {
            setWorkTitle(event.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder="예: 채식주의자, 인터스텔라, 죄와 벌"
          hint="소설·영화 등 구분 없이 작품명만 적습니다."
          error={titleError ?? undefined}
          autoFocus
          required
        />

        <Input
          label="작가 (선택)"
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="비워 두어도 됩니다"
        />

        <div className="flex w-full flex-col gap-ns-2">
          <label
            htmlFor="inspiration-memo"
            className="text-ns-sm font-medium text-ns-ink"
          >
            메모
          </label>
          <textarea
            id="inspiration-memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 겨울의 분위기만 참고. / 인물 감정선 참고."
            rows={4}
            className={cn(
              "min-h-24 w-full resize-y rounded-ns-md px-ns-4 py-ns-3",
              "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
              "bg-ns-surface border border-ns-border",
              "hover:border-ns-border-strong",
              "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
