"use client";

/**
 * =============================================================================
 * ForeshadowingFormModal
 * -----------------------------------------------------------------------------
 * 복선 생성/수정 — 제목(필수) · 설명(선택) · 상태.
 * =============================================================================
 */

import { useEffect, useState, type FormEvent } from "react";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import {
  DEFAULT_FORESHADOWING_STATUS,
  FORESHADOWING_STATUSES,
  FORESHADOWING_STATUS_LABELS,
  type ForeshadowingStatus,
} from "@/features/foreshadowing/types/foreshadowing";
import type { ForeshadowingInput } from "@/features/foreshadowing/lib/foreshadowing-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface ForeshadowingFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  foreshadowing?: Foreshadowing | null;
  onSubmit: (input: ForeshadowingInput) => void | Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  status: ForeshadowingStatus;
}

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  status: DEFAULT_FORESHADOWING_STATUS,
});

export function ForeshadowingFormModal({
  open,
  onClose,
  mode,
  foreshadowing,
  onSubmit,
}: ForeshadowingFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && foreshadowing) {
      setForm({
        title: foreshadowing.title,
        description: foreshadowing.description ?? "",
        status: foreshadowing.status,
      });
    } else {
      setForm(emptyForm());
    }
    setTitleError(null);
    setSaveError(null);
    setSaving(false);
  }, [open, mode, foreshadowing]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setTitleError("제목을 입력해 주세요.");
      return;
    }

    void (async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await onSubmit({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
        });
        onClose();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "복선을 저장하지 못했습니다.",
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
      title={isEdit ? "복선 수정" : "새 복선"}
      description={
        isEdit
          ? "심어 둔 내용과 회수 상태를 정리합니다."
          : "추적할 복선을 기록합니다."
      }
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </Button>
          <Button type="submit" form="foreshadowing-form" disabled={saving}>
            {saving ? "저장 중…" : isEdit ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form
        id="foreshadowing-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        {saveError ? (
          <p className="text-ns-sm text-ns-danger" role="alert">
            {saveError}
          </p>
        ) : null}

        <Input
          label="제목"
          value={form.title}
          onChange={(event) => {
            setField("title", event.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder="사라진 반지"
          error={titleError ?? undefined}
          autoFocus
          required
        />

        <div className="flex w-full flex-col gap-ns-2">
          <label
            htmlFor="foreshadowing-description"
            className="text-ns-sm font-medium text-ns-ink"
          >
            설명
          </label>
          <textarea
            id="foreshadowing-description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="왕자의 반지가 사라졌다는 사실을 초반에 언급한다."
            rows={4}
            className={cn(
              "min-h-24 w-full resize-y rounded-ns-md px-ns-4 py-ns-3",
              "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
              "bg-ns-surface border border-ns-border",
              "transition-[border-color,box-shadow] duration-150 ease-out",
              "hover:border-ns-border-strong",
              "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
            )}
          />
          <p className="ns-caption">선택 사항</p>
        </div>

        <div className="flex flex-col gap-ns-2">
          <span className="text-ns-sm font-medium text-ns-ink">상태</span>
          <div
            className="flex flex-wrap gap-ns-2"
            role="radiogroup"
            aria-label="복선 상태"
          >
            {FORESHADOWING_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={form.status === status}
                onClick={() => setField("status", status)}
                className={cn(
                  "min-h-10 rounded-ns-full px-ns-4 text-ns-sm font-medium transition-colors",
                  form.status === status
                    ? "bg-ns-accent text-ns-ink-inverse"
                    : "bg-ns-muted text-ns-ink-secondary hover:bg-ns-border",
                )}
              >
                ● {FORESHADOWING_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
