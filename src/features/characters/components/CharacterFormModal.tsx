"use client";

/**
 * =============================================================================
 * CharacterFormModal
 * -----------------------------------------------------------------------------
 * 인물 프로필 상세 — 생성/수정.
 * =============================================================================
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Character } from "@/features/characters/types/character";
import {
  CHARACTER_ROLE_LABELS,
  CHARACTER_ROLE_PRESETS,
  DEFAULT_CHARACTER_COLOR,
} from "@/features/characters/types/character";
import {
  readImageAsDataUrl,
  type CharacterInput,
} from "@/features/characters/lib/character-storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

export interface CharacterFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  character?: Character | null;
  onSubmit: (input: CharacterInput) => void;
}

const emptyInput = (): CharacterInput => ({
  name: "",
  role: "",
  age: "",
  gender: "",
  occupation: "",
  personality: "",
  goal: "",
  secret: "",
  memo: "",
  image: "",
  color: DEFAULT_CHARACTER_COLOR,
});

export function CharacterFormModal({
  open,
  onClose,
  mode,
  character,
  onSubmit,
}: CharacterFormModalProps) {
  const [form, setForm] = useState<CharacterInput>(emptyInput);
  const [nameError, setNameError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && character) {
      setForm({
        name: character.name,
        role: character.role,
        age: character.age,
        gender: character.gender,
        occupation: character.occupation,
        personality: character.personality,
        goal: character.goal,
        secret: character.secret,
        memo: character.memo,
        image: character.image,
        color: character.color || DEFAULT_CHARACTER_COLOR,
      });
    } else {
      setForm(emptyInput());
    }
    setNameError(null);
    setImageError(null);
  }, [open, mode, character]);

  const setField = <K extends keyof CharacterInput>(
    key: K,
    value: CharacterInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setField("image", dataUrl);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : "이미지를 올리지 못했습니다.",
      );
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setNameError("이름을 입력해 주세요.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      color: form.color.trim() || DEFAULT_CHARACTER_COLOR,
    });
    onClose();
  };

  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "인물 프로필" : "캐릭터 추가"}
      description={
        isEdit
          ? "집필 중 참고할 인물 정보를 정리합니다."
          : "새 인물 프로필을 만듭니다."
      }
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="character-form">
            {isEdit ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form
        id="character-form"
        className="flex flex-col gap-ns-5"
        onSubmit={handleSubmit}
      >
        {/* 이미지 + 색상 */}
        <div className="flex flex-col gap-ns-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-ns-2">
            <span className="text-ns-sm font-medium text-ns-ink">이미지</span>
            <div
              className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-ns-lg border border-ns-border bg-ns-muted"
              style={{
                background: form.image
                  ? undefined
                  : `linear-gradient(135deg, ${form.color}33, ${form.color}66)`,
              }}
            >
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-ns-xs text-ns-ink-tertiary">없음</span>
              )}
            </div>
            <div className="flex flex-wrap gap-ns-2">
              <label className="inline-flex min-h-10 cursor-pointer items-center rounded-ns-md border border-ns-border bg-ns-surface px-ns-3 text-ns-sm font-medium text-ns-ink hover:bg-ns-muted">
                업로드
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleImageChange(event)}
                />
              </label>
              {form.image ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setField("image", "")}
                >
                  제거
                </Button>
              ) : null}
            </div>
            {imageError ? (
              <p className="text-ns-sm text-ns-danger" role="alert">
                {imageError}
              </p>
            ) : (
              <p className="ns-caption">800KB 이하 권장</p>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-ns-2">
            <label
              htmlFor="character-color"
              className="text-ns-sm font-medium text-ns-ink"
            >
              대표 색상
            </label>
            <div className="flex items-center gap-ns-3">
              <input
                id="character-color"
                type="color"
                value={form.color || DEFAULT_CHARACTER_COLOR}
                onChange={(event) => setField("color", event.target.value)}
                className="h-12 w-14 cursor-pointer rounded-ns-md border border-ns-border bg-ns-surface p-1"
              />
              <Input
                value={form.color}
                onChange={(event) => setField("color", event.target.value)}
                placeholder="#2563eb"
                aria-label="색상 코드"
              />
            </div>
          </div>
        </div>

        <Input
          label="이름"
          value={form.name}
          onChange={(event) => {
            setField("name", event.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="김민준"
          error={nameError ?? undefined}
          autoFocus
          required
        />

        <div className="flex flex-col gap-ns-2">
          <Input
            label="역할"
            value={form.role}
            onChange={(event) => setField("role", event.target.value)}
            placeholder="주인공"
            hint="아래에서 고르거나 직접 입력"
          />
          <div className="flex flex-wrap gap-ns-2">
            {CHARACTER_ROLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setField("role", CHARACTER_ROLE_LABELS[preset])}
                className={cn(
                  "rounded-ns-full px-ns-3 py-ns-1 text-ns-xs font-medium",
                  form.role === CHARACTER_ROLE_LABELS[preset]
                    ? "bg-ns-accent text-ns-ink-inverse"
                    : "bg-ns-muted text-ns-ink-secondary hover:bg-ns-border",
                )}
              >
                {CHARACTER_ROLE_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-ns-4 sm:grid-cols-3">
          <Input
            label="나이"
            value={form.age}
            onChange={(event) => setField("age", event.target.value)}
            placeholder="28"
          />
          <Input
            label="성별"
            value={form.gender}
            onChange={(event) => setField("gender", event.target.value)}
            placeholder="여"
          />
          <Input
            label="직업"
            value={form.occupation}
            onChange={(event) => setField("occupation", event.target.value)}
            placeholder="기자"
          />
        </div>

        <TextAreaField
          id="character-personality"
          label="성격"
          value={form.personality}
          onChange={(value) => setField("personality", value)}
          placeholder="차분하지만 고집이 세다"
        />
        <TextAreaField
          id="character-goal"
          label="목표"
          value={form.goal}
          onChange={(value) => setField("goal", value)}
          placeholder="진실을 밝힌다"
        />
        <TextAreaField
          id="character-secret"
          label="비밀"
          value={form.secret}
          onChange={(value) => setField("secret", value)}
          placeholder="독자/작가만 아는 비밀"
        />
        <TextAreaField
          id="character-memo"
          label="메모"
          value={form.memo}
          onChange={(value) => setField("memo", value)}
          placeholder="집필 중 참고할 메모"
          rows={4}
        />
      </form>
    </Modal>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex w-full flex-col gap-ns-2">
      <label htmlFor={id} className="text-ns-sm font-medium text-ns-ink">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "min-h-20 w-full resize-y rounded-ns-md px-ns-4 py-ns-3",
          "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
          "bg-ns-surface border border-ns-border",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          "hover:border-ns-border-strong",
          "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
        )}
      />
    </div>
  );
}
