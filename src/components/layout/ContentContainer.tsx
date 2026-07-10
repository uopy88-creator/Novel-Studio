/**
 * =============================================================================
 * ContentContainer
 * -----------------------------------------------------------------------------
 * 본문 영역의 공통 래퍼.
 *
 * - 충분한 여백
 * - 읽기 편한 최대 너비 (너무 넓은 한 줄 방지)
 * - 페이지마다 패딩을 다시 쓰지 않도록 한곳에서 관리
 * =============================================================================
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * 콘텐츠 최대 너비
   * - default: 일반 작업 화면
   * - wide: 목록·표가 넓을 때
   * - full: 에디터처럼 가로를 최대한 쓸 때
   */
  width?: "default" | "wide" | "full";
}

const widthClasses = {
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

export function ContentContainer({
  children,
  className,
  width = "default",
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-ns-6 py-ns-8 sm:px-ns-8 sm:py-ns-10",
        widthClasses[width],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
