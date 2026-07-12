"use client";

/**
 * =============================================================================
 * SectionsPage
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * Section 구조(추가·이름·순서·상태·아이콘·메모)를 관리하는 전용 페이지.
 * Manuscript 는 집필 전용 — 목록에서 Section 을 선택하면 원고의 해당 위치로 이동한다.
 * =============================================================================
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Section } from "@/features/manuscript/types/section";
import type { ProjectId } from "@/types/ids";
import { useManuscript } from "@/features/manuscript/hooks/useManuscript";
import { useSections } from "@/features/manuscript/hooks/useSections";
import { SectionNavigator } from "@/features/manuscript/components/section-navigator";
import { manuscriptSearchHref } from "@/features/global-search/lib/search-href";
import { ContentContainer } from "@/components/layout";
import { studioPath } from "@/components/layout/nav-items";
import { ContextHelp } from "@/features/help";

export interface SectionsPageProps {
  projectId: ProjectId;
}

export function SectionsPage({ projectId }: SectionsPageProps) {
  const router = useRouter();
  const { isReady, primaryDocumentId, content, setContent } =
    useManuscript(projectId);

  const {
    sections,
    collapsedIds,
    toggleCollapsed,
    setAllCollapsed,
    reorder,
    add,
    remove,
    rename,
    setStatus,
    setMemo,
    toggleIcon,
  } = useSections(projectId, primaryDocumentId, content, setContent);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const timelineHref = useMemo(() => {
    if (!primaryDocumentId || !activeSectionId) return null;
    const params = new URLSearchParams({
      documentId: primaryDocumentId,
      sectionId: activeSectionId,
    });
    return `${studioPath(projectId, "timeline")}?${params.toString()}`;
  }, [projectId, primaryDocumentId, activeSectionId]);

  function handleSelect(section: Section) {
    setActiveSectionId(section.id);
    if (!primaryDocumentId) return;
    router.push(
      manuscriptSearchHref(projectId, primaryDocumentId, {
        sectionId: section.id,
        offset: section.startOffset,
      }),
    );
  }

  return (
    <ContentContainer width="wide">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">구조</p>
          <h2 className="ns-heading">Section</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            원고 구간을 나누고 순서·상태·아이콘·메모를 관리합니다. 항목을
            누르면 Manuscript의 해당 위치로 이동합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-ns-2">
          <ContextHelp topic="sections" projectId={projectId} />
        </div>
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <SectionNavigator
          variant="page"
          sections={sections}
          activeSectionId={activeSectionId}
          collapsedIds={collapsedIds}
          onSelect={handleSelect}
          onReorder={reorder}
          onAdd={() => {
            const id = add();
            if (id) setActiveSectionId(id);
          }}
          onDelete={remove}
          onRename={rename}
          onStatusChange={setStatus}
          onMemoChange={setMemo}
          onIconToggle={toggleIcon}
          onToggleCollapse={toggleCollapsed}
          onCollapseAll={() => setAllCollapsed(true)}
          onExpandAll={() => setAllCollapsed(false)}
          timelineHref={timelineHref}
        />
      )}
    </ContentContainer>
  );
}
