/**
 * =============================================================================
 * StatisticsPanel
 * -----------------------------------------------------------------------------
 * 원고 에디터 오른쪽 통계 패널.
 * content가 바뀔 때마다 부모가 계산한 값을 넘겨 실시간 반영한다.
 *
 * 계산 기준
 * - 원고지: 200자(공백 제외) = 1매 (반올림)
 * - 책 페이지: 250자(공백 제외) = 1페이지 (반올림)
 * =============================================================================
 */

import { Card } from "@/components/ui/Card";
import { formatCount } from "@/lib/stats";
import { cn } from "@/lib/utils/cn";

export interface StatisticsPanelProps {
  totalChars: number;
  charsWithoutSpaces: number;
  manuscriptSheets: number;
  bookPages: number;
  className?: string;
}

interface StatRowProps {
  label: string;
  value: string;
  hint: string;
}

function StatRow({ label, value, hint }: StatRowProps) {
  return (
    <div className="border-b border-ns-border py-ns-4 last:border-b-0">
      <p className="text-ns-sm text-ns-ink-secondary">{label}</p>
      <p className="mt-ns-1 text-ns-xl font-semibold tabular-nums text-ns-ink">
        {value}
      </p>
      <p className="mt-ns-1 text-ns-xs text-ns-ink-tertiary">{hint}</p>
    </div>
  );
}

export function StatisticsPanel({
  totalChars,
  charsWithoutSpaces,
  manuscriptSheets,
  bookPages,
  className,
}: StatisticsPanelProps) {
  return (
    <Card
      variant="outlined"
      padding="md"
      className={cn("h-fit", className)}
      aria-label="원고 통계"
    >
      <h3 className="mb-ns-1 text-ns-sm font-semibold text-ns-ink">통계</h3>
      <p className="mb-ns-2 text-ns-xs text-ns-ink-tertiary">
        입력과 동시에 갱신됩니다
      </p>

      <StatRow
        label="총 글자수"
        value={formatCount(totalChars)}
        hint="공백 포함"
      />
      <StatRow
        label="공백 제외 글자수"
        value={formatCount(charsWithoutSpaces)}
        hint="공백·개행 제외"
      />
      <StatRow
        label="예상 원고지 매수"
        value={formatCount(manuscriptSheets)}
        hint="200자 = 1매"
      />
      <StatRow
        label="예상 책 페이지"
        value={formatCount(bookPages)}
        hint="250자 = 1페이지"
      />
    </Card>
  );
}
