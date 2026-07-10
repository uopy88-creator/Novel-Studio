import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * =============================================================================
 * Input
 * -----------------------------------------------------------------------------
 * 텍스트 입력의 기본형.
 *
 * 디자인 의도
 * - 흰 배경 + 연한 보더, 포커스 시에만 파란 링
 * - iPad에서 탭하기 쉬운 높이 (min 44px)
 * - label / hint / error를 한 컴포넌트에서 일관되게 처리
 *
 * 사용 예
 * <Input label="작품 제목" placeholder="무제" />
 * <Input label="이메일" error="형식이 올바르지 않습니다." />
 * =============================================================================
 */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** 입력 필드 위에 표시되는 레이블 */
  label?: ReactNode;
  /** 레이블 아래/필드 아래 보조 설명 (에러가 없을 때) */
  hint?: ReactNode;
  /** 유효성 메시지 — 있으면 보더가 danger로 바뀜 */
  error?: ReactNode;
  /** 필드 왼쪽 장식 (아이콘 등) */
  leftSlot?: ReactNode;
  /** 필드 오른쪽 장식 (아이콘, 단위 등) */
  rightSlot?: ReactNode;
  /** 래퍼(label+field+hint)에 추가 클래스 */
  wrapperClassName?: string;
}

/**
 * 공용 Input
 *
 * - label과 input을 htmlFor/id로 연결해 접근성을 맞춘다.
 * - error가 있으면 aria-invalid / aria-describedby를 설정한다.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    wrapperClassName,
    label,
    hint,
    error,
    leftSlot,
    rightSlot,
    id,
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex w-full flex-col gap-ns-2", wrapperClassName)}>
      {/* 레이블 — 터치 타깃과 분리해 필드를 크게 유지 */}
      {label ? (
        <label
          htmlFor={inputId}
          className="text-ns-sm font-medium text-ns-ink"
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex w-full items-center">
        {leftSlot ? (
          <span className="pointer-events-none absolute left-ns-3 flex items-center text-ns-ink-tertiary">
            {leftSlot}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            // 크기 — iPad 터치 최소 높이
            "min-h-ns-touch w-full rounded-ns-md px-ns-4 py-ns-2",
            "text-ns-base text-ns-ink placeholder:text-ns-ink-tertiary",
            // 표면
            "bg-ns-surface border border-ns-border",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            // 호버/포커스
            "hover:border-ns-border-strong",
            "focus-visible:border-ns-accent focus-visible:shadow-[var(--ns-ring-accent)]",
            // 에러
            Boolean(error) &&
              "border-ns-danger hover:border-ns-danger focus-visible:border-ns-danger focus-visible:shadow-[0_0_0_3px_rgb(220_38_38_/_0.2)]",
            // 비활성
            "disabled:cursor-not-allowed disabled:bg-ns-muted disabled:text-ns-ink-tertiary",
            // 슬롯 여백
            Boolean(leftSlot) && "pl-ns-10",
            Boolean(rightSlot) && "pr-ns-10",
            className,
          )}
          {...props}
        />

        {rightSlot ? (
          <span className="absolute right-ns-3 flex items-center text-ns-ink-tertiary">
            {rightSlot}
          </span>
        ) : null}
      </div>

      {/* 에러가 있으면 hint 대신 에러를 보여 혼선을 줄인다 */}
      {error ? (
        <p id={errorId} className="text-ns-sm text-ns-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="ns-caption">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
