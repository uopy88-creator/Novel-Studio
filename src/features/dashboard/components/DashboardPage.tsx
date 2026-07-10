"use client";

/**
 * =============================================================================
 * DashboardPage
 * -----------------------------------------------------------------------------
 * 작품 작업실의 홈. 통계·최근 Document·대표 캐릭터를 한눈에 보여 준다.
 * =============================================================================
 */

import Link from "next/link";
import type { ProjectId } from "@/types/ids";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { StatisticsGrid } from "@/features/dashboard/components/StatisticsGrid";
import { RecentDocumentCard } from "@/features/dashboard/components/RecentDocumentCard";
import { FeaturedCharacterCard } from "@/features/characters/components/FeaturedCharacterCard";
import { RecentInspirationCard } from "@/features/inspiration/components/RecentInspirationCard";
import { ContentContainer } from "@/components/layout";
import { studioPath } from "@/components/layout/nav-items";

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

          <section aria-label="대표 캐릭터">
      <div className="mb-ns-4 flex min-w-0 flex-wrap items-end justify-between gap-ns-4">
              <h3 className="text-ns-base font-semibold text-ns-ink">
                대표 캐릭터
              </h3>
              <Link
                href={studioPath(projectId, "characters")}
                className="shrink-0 text-ns-sm font-medium text-ns-accent hover:text-ns-accent-hover"
              >
                전체 보기
              </Link>
            </div>

            {snapshot.featuredCharacters.length === 0 ? (
              <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-10 text-center">
                <p className="text-ns-sm text-ns-ink-secondary">
                  아직 인물이 없습니다. Characters 메뉴에서 프로필을 만들어
                  보세요.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-ns-3 sm:grid-cols-2 lg:grid-cols-4">
                {snapshot.featuredCharacters.map((character) => (
                  <li key={character.id}>
                    <FeaturedCharacterCard
                      character={character}
                      projectId={projectId}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="최근 Inspiration">
            <div className="mb-ns-4 flex min-w-0 flex-wrap items-end justify-between gap-ns-4">
              <h3 className="text-ns-base font-semibold text-ns-ink">
                최근 Inspiration
              </h3>
              <Link
                href={studioPath(projectId, "inspiration")}
                className="shrink-0 text-ns-sm font-medium text-ns-accent hover:text-ns-accent-hover"
              >
                전체 보기
              </Link>
            </div>

            {snapshot.recentInspirations.length === 0 ? (
              <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/40 px-ns-6 py-ns-10 text-center">
                <p className="text-ns-sm text-ns-ink-secondary">
                  아직 영감 노트가 없습니다. Manuscript에서 문장을 선택해 💡을
                  남겨 보세요.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-ns-3 md:grid-cols-3">
                {snapshot.recentInspirations.map((inspiration) => (
                  <li key={inspiration.id}>
                    <RecentInspirationCard
                      inspiration={inspiration}
                      projectId={projectId}
                    />
                  </li>
                ))}
              </ul>
            )}
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
