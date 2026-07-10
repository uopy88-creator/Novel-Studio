/**
 * =============================================================================
 * StatisticsGrid
 * -----------------------------------------------------------------------------
 * Dashboard 상단 통계 카드 그리드.
 *
 * 반응형
 * - 모바일: 1열
 * - iPad(md): 2열
 * - PC(xl): 4열
 *
 * 보기 전용.
 * =============================================================================
 */

import { DashboardCard } from "@/features/dashboard/components/DashboardCard";
import { formatCount } from "@/lib/stats";
import { cn } from "@/lib/utils/cn";

export interface StatisticsGridProps {
  totalChars: number;
  charsWithoutSpaces: number;
  manuscriptSheets: number;
  bookPages: number;
  memoCount: number;
  characterCount: number;
  className?: string;
}

export function StatisticsGrid({
  totalChars,
  charsWithoutSpaces,
  manuscriptSheets,
  bookPages,
  memoCount,
  characterCount,
  className,
}: StatisticsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-ns-4 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      <DashboardCard
        label="총 글자수"
        value={formatCount(totalChars)}
        hint="공백 포함"
      />
      <DashboardCard
        label="공백 제외 글자수"
        value={formatCount(charsWithoutSpaces)}
        hint="공백·개행 제외"
      />
      <DashboardCard
        label="예상 원고지 매수"
        value={formatCount(manuscriptSheets)}
        hint="200자 = 1매 (반올림)"
      />
      <DashboardCard
        label="예상 책 페이지"
        value={formatCount(bookPages)}
        hint="250자 = 1페이지 (반올림)"
      />
      <DashboardCard
        label="메모"
        value={formatCount(memoCount)}
        hint="개"
      />
      <DashboardCard
        label="캐릭터"
        value={formatCount(characterCount)}
        hint="명"
      />
    </div>
  );
}
