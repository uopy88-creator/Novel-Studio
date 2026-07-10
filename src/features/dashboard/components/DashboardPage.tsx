"use client";

/**
 * =============================================================================
 * DashboardPage
 * -----------------------------------------------------------------------------
 * 작품 작업실의 홈. 통계·최근 Document를 한눈에 보여 준다.
 *
 * - AppLayout 안에서 렌더된다 (라우트 layout)
 * - 보기 전용 (생성/수정/삭제 UI 없음)
 * - Document(Chapter) 기능은 건드리지 않는다
 * =============================================================================
 */

import type { ProjectId } from "@/types/ids";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { StatisticsGrid } from "@/features/dashboard/components/StatisticsGrid";
import { RecentDocumentCard } from "@/features/dashboard/components/RecentDocumentCard";
import { ContentContainer } from "@/components/layout";

export interface DashboardPageProps {
  projectId: ProjectId;
}

export function DashboardPage({ projectId }: DashboardPageProps) {
  const { snapshot, isReady } = useDashboard(projectId);

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8">
        <p className="ns-caption mb-ns-2">작업실</p>
        <h2 className="ns-heading">Dashboard</h2>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          작품 현황을 한눈에 확인합니다. 이 화면에서는 수정할 수 없습니다.
        </p>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <div className="flex flex-col gap-ns-10">
          <section aria-label="통계">
            <StatisticsGrid
              totalChars={snapshot.totalChars}
              charsWithoutSpaces={snapshot.charsWithoutSpaces}
              manuscriptSheets={snapshot.manuscriptSheets}
              bookPages={snapshot.bookPages}
              memoCount={snapshot.memoCount}
              characterCount={snapshot.characterCount}
            />
          </section>

          <section aria-label="최근 수정한 Document">
            <h3 className="mb-ns-4 text-ns-base font-semibold text-ns-ink">
              최근 수정한 Document
            </h3>

            {snapshot.recentDocuments.length === 0 ? (
              <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-10 text-center">
                <p className="text-ns-sm text-ns-ink-secondary">
                  아직 Document가 없습니다. Chapters 메뉴에서 추가해 보세요.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-ns-3">
                {snapshot.recentDocuments.map((document) => (
                  <li key={document.id}>
                    <RecentDocumentCard
                      document={document}
                      projectId={projectId}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </ContentContainer>
  );
}
