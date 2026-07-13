"use client";

/**
 * =============================================================================
 * MemoModal — 생성 / 수정 (내용 + Pin 만)
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Memo } from "@/features/memo/types/memo";
import type { MemoInput } from "@/features/memo/lib/memo-storage";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface MemoModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  memo?: Memo | null;
  /** 선택 텍스트로 본문 미리 채움 (Selection Action) */
  initialBody?: string;
  /** Pin 초기값 */
  initialPinned?: boolean;
  onSubmit: (input: MemoInput) => void;
  onDelete?: () => void;
}

export function MemoModal({
  open,
  onClose,
  mode,
  memo,
  initialBody = "",
  initialPinned = false,
  onSubmit,
  onDelete,
}: MemoModalProps) {
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && memo) {
      setBody(memo.body);
      setIsPinned(memo.isPinned);
    } else {
      setBody(initialBody);
      setIsPinned(initialPinned);
    }
    setError(null);
  }, [open, mode, memo, initialBody, initialPinned]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError("내용을 입력해 주세요.");
      return;
    }
    onSubmit({
      body: trimmed,
      isPinned,
      kind: memo?.kind ?? "note",
    });
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Memo 수정" : "Memo 만들기"}
      description={
        isEdit
          ? "떠오른 생각을 다듬습니다."
          : "짧게 적고 나중에 이어서 생각하세요."
      }
      size="md"
      footer={
        <>
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="danger-ghost"
              className="mr-auto"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              삭제
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="memo-form">
            {isEdit ? "저장" : "만들기"}
          </Button>
        </>
      }
    >
      <form id="memo-form" className="flex flex-col gap-ns-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-ns-2">
          <span className="text-ns-xs font-medium text-ns-ink-secondary">
            내용
          </span>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError(null);
            }}
            rows={6}
            placeholder="떠오른 생각을 적어 주세요"
            className={cn(
              "w-full resize-y rounded-ns-lg border bg-ns-surface px-ns-3 py-ns-2",
              "text-ns-sm leading-ns-relaxed text-ns-ink",
              "placeholder:text-ns-ink-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-ns-accent/30",
              error ? "border-red-300" : "border-ns-border",
            )}
            autoFocus
          />
          {error ? (
            <span className="text-ns-xs text-red-600">{error}</span>
          ) : null}
        </label>

        <button
          type="button"
          onClick={() => setIsPinned((v) => !v)}
          className={cn(
            "inline-flex w-fit items-center gap-ns-2 rounded-ns-lg border px-ns-3 py-ns-2",
            "text-ns-sm transition-colors",
            isPinned
              ? "border-ns-accent bg-ns-accent/10 text-ns-accent"
              : "border-ns-border text-ns-ink-secondary hover:bg-ns-muted",
          )}
          aria-pressed={isPinned}
        >
          <span aria-hidden>{isPinned ? "📌" : "📍"}</span>
          {isPinned ? "고정됨" : "상단에 고정"}
        </button>
      </form>
    </Modal>
  );
}
