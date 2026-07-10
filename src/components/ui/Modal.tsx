"use client";

import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

/**
 * =============================================================================
 * Modal
 * -----------------------------------------------------------------------------
 * 확인/폼/짧은 작업용 오버레이 다이얼로그.
 *
 * 디자인 의도
 * - 화면을 가리되 과하지 않은 반투명 오버레이
 * - 중앙 카드형 패널, 넉넉한 패딩과 둥근 모서리
 * - iPad에서도 닫기 버튼·액션 버튼이 누르기 쉬운 크기
 *
 * 접근성
 * - role="dialog", aria-modal
 * - Escape로 닫기
 * - 열릴 때 이전에 포커스된 요소를 기억했다가 닫을 때 복원
 * - 열림 중 body 스크롤 잠금
 *
 * 사용 예
 * <Modal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="작품 삭제"
 *   description="이 작업은 되돌릴 수 없습니다."
 *   footer={
 *     <>
 *       <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
 *       <Button variant="danger">삭제</Button>
 *     </>
 *   }
 * >
 *   ...
 * </Modal>
 * =============================================================================
 */

export interface ModalProps {
  /** 열림 여부 — 제어 컴포넌트 */
  open: boolean;
  /** 닫기 요청 (오버레이 클릭, Escape, 닫기 버튼) */
  onClose: () => void;
  /** 모달 제목 */
  title: ReactNode;
  /** 제목 아래 짧은 설명 */
  description?: ReactNode;
  /** 본문 */
  children?: ReactNode;
  /** 하단 액션 영역 (보통 Button 그룹) */
  footer?: ReactNode;
  /**
   * 패널 너비
   * - sm : 확인 다이얼로그
   * - md : 기본 폼
   * - lg : 조금 더 넓은 편집
   */
  size?: "sm" | "md" | "lg";
  /** 오버레이 클릭으로 닫기 (기본 true) */
  closeOnOverlayClick?: boolean;
  /** Escape로 닫기 (기본 true) */
  closeOnEscape?: boolean;
  /** 우상단 X 버튼 표시 (기본 true) */
  showCloseButton?: boolean;
  /** 패널에 추가 클래스 */
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

/**
 * 공용 Modal
 *
 * 포털 없이 현재 트리에 렌더한다.
 * (나중에 필요하면 createPortal로 확장 가능)
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /** Escape 키로 닫기 */
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEscape, onClose]);

  /** 열릴 때 포커스 이동, 닫힐 때 복원 + 배경 스크롤 잠금 */
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 패널로 포커스를 옮겨 스크린 리더/키보드 사용자가 바로 인지하게 한다
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-ns-4 sm:items-center sm:p-ns-6"
      role="presentation"
    >
      {/* 반투명 오버레이 — 클릭 시 닫기 */}
      <button
        type="button"
        aria-label="모달 닫기"
        className="absolute inset-0 cursor-default bg-ns-overlay"
        onClick={closeOnOverlayClick ? onClose : undefined}
        tabIndex={-1}
      />

      {/* 패널 */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full flex-col",
          "rounded-ns-xl bg-ns-surface shadow-ns-lg",
          "border border-ns-border",
          "max-h-[min(90vh,52rem)] outline-none",
          sizeClasses[size],
          className,
        )}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-ns-4 border-b border-ns-border px-ns-6 py-ns-5">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-ns-xl font-semibold leading-ns-snug text-ns-ink"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-ns-1 text-ns-sm leading-ns-normal text-ns-ink-secondary"
              >
                {description}
              </p>
            ) : null}
          </div>

          {showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="닫기"
              onClick={onClose}
              className="shrink-0 px-ns-3"
            >
              {/* 텍스트 X — 아이콘 라이브러리 없이 심플하게 */}
              <span aria-hidden="true" className="text-ns-lg leading-none">
                ×
              </span>
            </Button>
          ) : null}
        </div>

        {/* 본문 — 긴 내용은 스크롤 */}
        {children ? (
          <div className="overflow-y-auto px-ns-6 py-ns-5">{children}</div>
        ) : null}

        {/* 푸터 */}
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-ns-3 border-t border-ns-border px-ns-6 py-ns-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 모달 본문을 구역으로 나눌 때 쓰는 가벼운 래퍼 (선택)
 */
export function ModalSection({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-ns-4", className)} {...props}>
      {children}
    </div>
  );
}
