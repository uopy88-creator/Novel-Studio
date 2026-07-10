"use client";

/**
 * =============================================================================
 * ManuscriptWorkspace
 * -----------------------------------------------------------------------------
 * Novel Studio의 핵심 화면.
 *
 * 흐름
 * Project → Document(Chapter) 선택 → Manuscript 편집
 *
 * - 자동 저장 (LocalStorage)
 * - 원고 내 검색 + 위치 이동
 * - 오른쪽 실시간 통계 패널
 * =============================================================================
 */

import { useMemo, useRef } from "react";
import type { ChapterId, ProjectId } from "@/types/ids";
import { useManuscript } from "@/features/manuscript/hooks/useManuscript";
import { ManuscriptEditor } from "@/features/manuscript/components/ManuscriptEditor";
import { SearchBar } from "@/features/manuscript/components/SearchBar";
import { StatisticsPanel } from "@/features/manuscript/components/StatisticsPanel";
import { AutoSaveIndicator } from "@/features/manuscript/components/AutoSaveIndicator";
import { DOCUMENT_KIND_LABELS } from "@/features/manuscript/types/chapter";
import { ContentContainer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/features/dashboard/lib/stats";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptWorkspaceProps {
  projectId: ProjectId;
  /** Document 목록에서 넘어올 때 자동 선택 */
  initialDocumentId?: string;
}

export function ManuscriptWorkspace({
  projectId,
  initialDocumentId,
}: ManuscriptWorkspaceProps) {
  const {
    documents,
    isReady,
    selectedChapterId,
    selectDocument,
    content,
    setContent,
    saveStatus,
    lastSavedAt,
  } = useManuscript(projectId, initialDocumentId as ChapterId | undefined);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedChapterId) ?? null,
    [documents, selectedChapterId],
  );

  const stats = useMemo(() => {
    const totalChars = countCharsWithSpaces(content);
    const charsWithoutSpaces = countCharsWithoutSpaces(content);
    return {
      totalChars,
      charsWithoutSpaces,
      manuscriptSheets: estimateManuscriptSheets(charsWithoutSpaces),
      bookPages: estimateBookPages(charsWithoutSpaces),
    };
  }, [content]);

  /** 검색 결과 → textarea 선택 영역으로 이동 */
  const jumpToMatch = (start: number, end: number) => {
    const el = editorRef.current;
    if (!el) return;

    el.focus();
    el.setSelectionRange(start, end);

    // 대략적인 스크롤: 줄 높이 기준으로 맞춤
    const before = content.slice(0, start);
    const lineNumber = before.split("\n").length;
    const lineHeight = 28;
    el.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
  };

  return (
    <ContentContainer width="full" className="max-w-7xl">
      <header className="mb-ns-6 flex flex-col gap-ns-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">집필</p>
          <h2 className="ns-heading">Manuscript</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            Document를 선택한 뒤 원고를 작성하세요. 입력 내용은 자동 저장됩니다.
          </p>
        </div>
        {selectedDocument ? (
          <AutoSaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            className="sm:mb-1"
          />
        ) : null}
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : documents.length === 0 ? (
        <EmptyDocumentsHint />
      ) : (
        <div className="flex flex-col gap-ns-6">
          {/* Document 선택 */}
          <section aria-label="Document 선택">
            <p className="mb-ns-3 text-ns-sm font-medium text-ns-ink">
              Document
            </p>
            <ul className="flex flex-wrap gap-ns-2">
              {documents.map((document) => {
                const active = document.id === selectedChapterId;
                return (
                  <li key={document.id}>
                    <Button
                      type="button"
                      size="sm"
                      variant={active ? "primary" : "secondary"}
                      onClick={() => selectDocument(document.id)}
                      className={cn(active && "shadow-ns-sm")}
                    >
                      {DOCUMENT_KIND_LABELS[document.kind] ?? "소설"} ·{" "}
                      {document.title}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          {!selectedDocument ? (
            <Card variant="muted" padding="lg" className="text-center">
              <p className="text-ns-base text-ns-ink-secondary">
                위에서 Document를 선택하면 에디터가 열립니다.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-ns-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
              {/* 에디터 열 */}
              <div className="flex min-w-0 flex-col gap-ns-4">
                <div className="flex flex-col gap-ns-1">
                  <p className="text-ns-xs font-medium text-ns-accent">
                    {DOCUMENT_KIND_LABELS[selectedDocument.kind] ?? "소설"}
                  </p>
                  <h3 className="text-ns-lg font-semibold text-ns-ink">
                    {selectedDocument.title}
                  </h3>
                  {selectedDocument.summary ? (
                    <p className="text-ns-sm text-ns-ink-secondary">
                      {selectedDocument.summary}
                    </p>
                  ) : null}
                </div>

                <SearchBar content={content} onJump={jumpToMatch} />

                <ManuscriptEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  documentTitle={selectedDocument.title}
                  className="min-h-[32rem]"
                />
              </div>

              {/* 통계 패널 — PC에서 오른쪽, 좁은 화면에서는 아래 */}
              <StatisticsPanel
                totalChars={stats.totalChars}
                charsWithoutSpaces={stats.charsWithoutSpaces}
                manuscriptSheets={stats.manuscriptSheets}
                bookPages={stats.bookPages}
                className="xl:sticky xl:top-ns-6"
              />
            </div>
          )}
        </div>
      )}
    </ContentContainer>
  );
}

function EmptyDocumentsHint() {
  return (
    <Card
      variant="outlined"
      padding="lg"
      className="border-dashed bg-ns-muted/40 text-center"
    >
      <p className="text-ns-lg font-medium text-ns-ink">
        먼저 Document가 필요합니다
      </p>
      <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
        Chapters 메뉴에서 Document를 만든 뒤 여기서 원고를 작성하세요.
      </p>
    </Card>
  );
}
