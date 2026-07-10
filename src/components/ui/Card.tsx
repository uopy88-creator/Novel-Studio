import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * =============================================================================
 * Card
 * -----------------------------------------------------------------------------
 * 콘텐츠를 묶는 기본 컨테이너.
 *
 * 디자인 의도
 * - 흰 배경 + 얇은 보더 + 부드러운 라운드
 * - 그림자는 거의 없거나 아주 약하게 (과한 elevation 지양)
 * - 충분한 내부 여백으로 "답답하지 않은 작업실" 느낌
 *
 * 구성
 * - Card       : 외곽 컨테이너
 * - CardHeader : 제목/액션 영역
 * - CardTitle  : 카드 제목
 * - CardDescription : 보조 설명
 * - CardContent: 본문
 * - CardFooter : 하단 액션
 *
 * 사용 예
 * <Card>
 *   <CardHeader>
 *     <CardTitle>작품 정보</CardTitle>
 *     <CardDescription>기본 메타데이터를 관리합니다.</CardDescription>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 * </Card>
 * =============================================================================
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 패딩 밀도
   * - md : 기본 (20px) — 대부분의 목록/설정
   * - lg : 넉넉 (24px) — 대시보드 요약, 빈 상태
   * - none : 패딩 없음 — 내부에서 직접 제어할 때
   */
  padding?: "none" | "md" | "lg";
  /**
   * 시각 변형
   * - outlined : 보더만 (기본, 권장)
   * - muted    : 연한 회색 배경 (섹션 구분)
   * - elevated : 아주 약한 그림자
   */
  variant?: "outlined" | "muted" | "elevated";
}

const paddingClasses = {
  none: "p-0",
  md: "p-ns-5",
  lg: "p-ns-6",
} as const;

const variantClasses = {
  outlined: "bg-ns-surface border border-ns-border",
  muted: "bg-ns-muted border border-transparent",
  elevated: "bg-ns-surface border border-ns-border shadow-ns-md",
} as const;

/**
 * 카드 루트
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, padding = "md", variant = "outlined", children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-ns-lg",
        paddingClasses[padding],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

/**
 * 카드 상단 영역 — 제목과 우측 액션을 가로로 배치할 때 사용
 */
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-ns-4 flex flex-col gap-ns-1 sm:flex-row sm:items-start sm:justify-between sm:gap-ns-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

/**
 * 카드 제목 — 페이지 제목(ns-title)보다 한 단계 낮은 계층
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, children, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-ns-lg font-semibold leading-ns-snug tracking-tight text-ns-ink",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

/**
 * 카드 설명 — 제목 아래 보조 문장
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("ns-body-sm", className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

/**
 * 카드 본문
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn("min-w-0", className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

/**
 * 카드 하단 — 버튼 그룹 등
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-ns-5 flex flex-wrap items-center justify-end gap-ns-3 border-t border-ns-border pt-ns-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";
