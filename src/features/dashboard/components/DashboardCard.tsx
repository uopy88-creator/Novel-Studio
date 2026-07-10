/**
 * =============================================================================
 * DashboardCard
 * -----------------------------------------------------------------------------
 * Dashboard 통계 한 칸.
 * 보기 전용 — 클릭/수정 동작 없음.
 * =============================================================================
 */

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface DashboardCardProps {
  /** 카드 상단 라벨 (예: 총 글자수) */
  label: string;
  /** 큰 숫자 또는 짧은 값 */
  value: ReactNode;
  /** 단위·보조 설명 (예: 자, 매) */
  hint?: string;
  className?: string;
}

export function DashboardCard({
  label,
  value,
  hint,
  className,
}: DashboardCardProps) {
  return (
    <Card
      variant="outlined"
      padding="lg"
      className={cn("flex min-h-[7.5rem] flex-col justify-between", className)}
    >
      <p className="text-ns-sm font-medium text-ns-ink-secondary">{label}</p>
      <div>
        <p className="text-ns-2xl font-semibold tracking-tight text-ns-ink tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-ns-1 text-ns-xs text-ns-ink-tertiary">{hint}</p>
        ) : null}
      </div>
    </Card>
  );
}
