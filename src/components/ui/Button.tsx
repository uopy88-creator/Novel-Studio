import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * =============================================================================
 * Button
 * -----------------------------------------------------------------------------
 * Novel Studio의 기본 액션 컴포넌트.
 *
 * 디자인 의도
 * - Notion / Linear 처럼 과장 없는 평면적 버튼
 * - iPad 터치에 맞게 최소 높이 44px (size="md" 기준)
 * - 포인트 컬러(파랑)는 primary에만 사용해 시각적 소음을 줄인다
 *
 * 사용 예
 * <Button>저장</Button>
 * <Button variant="secondary">취소</Button>
 * <Button variant="ghost" size="sm">더보기</Button>
 * =============================================================================
 */

/** 버튼 시각 스타일 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-ghost";

/** 버튼 크기 — sm도 터치 가능하도록 너무 작지 않게 유지 */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 시각적 강조 정도
   * - primary   : 주요 액션 (파란 배경)
   * - secondary : 보조 액션 (연한 회색 테두리)
   * - ghost     : 텍스트형, 툴바/인라인용
   * - danger    : 삭제 등 위험 액션
   * - danger-ghost : 위험하지만 덜 강조
   */
  variant?: ButtonVariant;
  /**
   * 크기
   * - sm : 밀집 UI (필터, 인라인)
   * - md : 기본 (권장)
   * - lg : 주요 CTA, iPad 홈 액션
   */
  size?: ButtonSize;
  /** true면 가로로 꽉 채움 */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ns-accent text-ns-ink-inverse hover:bg-ns-accent-hover shadow-ns-sm",
  secondary:
    "bg-ns-surface text-ns-ink border border-ns-border hover:bg-ns-muted hover:border-ns-border-strong",
  ghost: "bg-transparent text-ns-ink-secondary hover:bg-ns-muted hover:text-ns-ink",
  danger: "bg-ns-danger text-ns-ink-inverse hover:bg-ns-danger-hover shadow-ns-sm",
  "danger-ghost":
    "bg-transparent text-ns-danger hover:bg-ns-danger-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  /* min-h는 iPad 터치 영역 확보용 */
  sm: "min-h-10 px-ns-3 text-ns-sm gap-ns-2 rounded-ns-md",
  md: "min-h-ns-touch px-ns-4 text-ns-sm gap-ns-2 rounded-ns-md",
  lg: "min-h-12 px-ns-6 text-ns-base gap-ns-3 rounded-ns-lg",
};

/**
 * 공용 Button
 *
 * forwardRef를 사용해 포커스 제어·폼 라이브러리와 호환한다.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      type = "button",
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          // 공통 베이스
          "inline-flex items-center justify-center font-medium",
          "transition-colors duration-150 ease-out",
          "select-none whitespace-nowrap",
          // 키보드 포커스 (globals.css의 :focus-visible과 함께 동작)
          "focus-visible:outline-none",
          // 비활성
          "disabled:pointer-events-none disabled:opacity-45",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
