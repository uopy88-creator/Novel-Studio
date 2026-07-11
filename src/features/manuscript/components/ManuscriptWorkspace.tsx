"use client";

/**
 * =============================================================================
 * ManuscriptWorkspace
 * -----------------------------------------------------------------------------
 * Document 선택 → 하나의 긴 Manuscript 편집
 * + Scene Navigator (#1 #2 … 구분자 기반)
 * + 캐릭터 @멘션, Inspiration
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { Scene } from "@/features/manuscript/types/scene";
import type { ChapterId, ProjectId } from "@/types/ids";
import { useManuscript } from "@/features/manuscript/hooks/useManuscript";
import { useScenes } from "@/features/manuscript/hooks/useScenes";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { updateCharacter } from "@/features/characters/lib/character-storage";
import { CharacterMentionField } from "@/features/characters/components/CharacterMentionField";
import { CharacterFormModal } from "@/features/characters/components/CharacterFormModal";
import { useInspirations } from "@/features/inspiration/hooks/useInspirations";
import { InspirationSelectionMenu } from "@/features/inspiration/components/InspirationSelectionMenu";
import { InspirationGutter } from "@/features/inspiration/components/InspirationGutter";
import { InspirationModal } from "@/features/inspiration/components/InspirationModal";
import { InspirationDeleteDialog } from "@/features/inspiration/components/InspirationDeleteDialog";
import type { TextSelectionRange } from "@/features/inspiration/components/InspirationSelectionMenu";
import { SceneNavigator } from "@/features/manuscript/components/scene-navigator";
import { ChapterOutline } from "@/features/manuscript/components/ChapterOutline";
import { SearchBar } from "@/features/manuscript/components/SearchBar";
import { StatisticsPanel } from "@/features/manuscript/components/StatisticsPanel";
import { AutoSaveIndicator } from "@/features/manuscript/components/AutoSaveIndicator";
import { ManuscriptVersionModal } from "@/features/manuscript/components/version-history";
import { useManuscriptVersions } from "@/features/manuscript/hooks/useManuscriptVersions";
import { useAutoRecovery } from "@/features/manuscript/hooks/useAutoRecovery";
import { AutoRecoveryDialog } from "@/features/manuscript/components/AutoRecoveryDialog";
import { ExportModal } from "@/features/export/components/ExportModal";
import { SentenceAssistantHost } from "@/features/sentence-assistant";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import {
  chapterLocalToGlobalOffset,
  globalOffsetToChapterLocal,
} from "@/features/manuscript/lib/chapter-blocks";
import { ContentContainer } from "@/components/layout";
import { studioPath } from "@/components/layout/nav-items";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ContextHelp } from "@/features/help";
import { useUserSettings } from "@/features/settings";
import { EDITOR_WIDTH_CLASS } from "@/features/settings/types/user-settings";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/lib/stats";
import { readInspirationsByProject } from "@/features/inspiration/lib/inspiration-storage";

export interface ManuscriptWorkspaceProps {
  projectId: ProjectId;
  initialDocumentId?: string;
  /** 전역 검색 등에서 전달 — 본문 오프셋으로 스크롤 */
  initialOffset?: number;
  initialEnd?: number;
  /** 전역 검색 — Scene 안정 ID로 선택 */
  initialSceneId?: string;
}

export function ManuscriptWorkspace({
  projectId,
  initialDocumentId,
  initialOffset,
  initialEnd,
  initialSceneId,
}: ManuscriptWorkspaceProps) {
  const { settings } = useUserSettings();

  const {
    documents,
    isReady,
    selectedChapterId,
    selectDocument,
    content,
    setContent,
    setChapterBody,
    chapterBlocks,
    reorderDocuments,
    saveStatus,
    lastSavedAt,
  } = useManuscript(projectId, initialDocumentId as ChapterId | undefined);

  const activeChapterBody = useMemo(() => {
    const block = chapterBlocks.find((b) => b.chapterId === selectedChapterId);
    return block?.body ?? "";
  }, [chapterBlocks, selectedChapterId]);

  const setActiveChapterBody = useCallback(
    (body: string) => {
      if (!selectedChapterId) return;
      setChapterBody(selectedChapterId, body);
    },
    [selectedChapterId, setChapterBody],
  );

  const {
    scenes,
    collapsedIds,
    toggleCollapsed,
    setAllCollapsed,
    reorder,
    add,
    remove,
    rename,
    setStatus,
    setMemo,
  } = useScenes(
    projectId,
    selectedChapterId,
    activeChapterBody,
    setActiveChapterBody,
  );

  const {
    versions,
    isLoading: versionsLoading,
    isSaving: versionSaving,
    error: versionError,
    saveCurrent: saveVersion,
    rename: renameVersion,
  } = useManuscriptVersions(projectId, selectedChapterId);

  const {
    offer: recoveryOffer,
    showDiff: recoveryShowDiff,
    setShowDiff: setRecoveryShowDiff,
    acceptRecovery,
    discardRecovery,
  } = useAutoRecovery({
    projectId,
    chapterId: selectedChapterId,
    content,
    setContent,
    saveStatus,
  });

  const {
    create: createInspiration,
    update: updateInspiration,
    remove: removeInspiration,
  } = useInspirations(projectId);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [profile, setProfile] = useState<Character | null>(null);
  const [projectInspirations, setProjectInspirations] = useState<Inspiration[]>(
    [],
  );
  const [pendingSelection, setPendingSelection] =
    useState<TextSelectionRange | null>(null);
  const [viewingInspiration, setViewingInspiration] =
    useState<Inspiration | null>(null);
  const [deletingInspiration, setDeletingInspiration] =
    useState<Inspiration | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await readCharactersByProject(projectId);
      if (!cancelled) setCharacters(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refreshInspirations = useCallback(async () => {
    setProjectInspirations(await readInspirationsByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    void refreshInspirations();
  }, [refreshInspirations, content]);

  /** 통합 원고 좌표로 변환한 Inspiration (거터 표시용) */
  const gutterInspirations = useMemo(() => {
    return projectInspirations.map((item) => ({
      ...item,
      startOffset: chapterLocalToGlobalOffset(
        content,
        documents,
        item.documentId,
        item.startOffset,
      ),
      endOffset: chapterLocalToGlobalOffset(
        content,
        documents,
        item.documentId,
        item.endOffset,
      ),
    }));
  }, [projectInspirations, content, documents]);

  // Document 바꾸면 Scene 선택 초기화 후 첫 Scene 선택
  useEffect(() => {
    setActiveSceneId(null);
  }, [selectedChapterId]);

  useEffect(() => {
    if (scenes.length === 0) {
      setActiveSceneId(null);
      return;
    }
    setActiveSceneId((current) => {
      if (current && scenes.some((s) => s.id === current)) return current;
      return scenes[0].id;
    });
  }, [scenes]);

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
      bookPages: estimateBookPages(totalChars),
    };
  }, [content]);

  /** Scene Navigator → Timeline 연동 (선택 Scene 기준) */
  const timelineHref = useMemo(() => {
    if (!selectedChapterId || !activeSceneId) return null;
    const params = new URLSearchParams({
      documentId: selectedChapterId,
      sceneId: activeSceneId,
    });
    return `${studioPath(projectId, "timeline")}?${params.toString()}`;
  }, [projectId, selectedChapterId, activeSceneId]);

  const scrollToOffset = useCallback(
    (
      start: number,
      end = start,
      options?: { focus?: boolean },
    ) => {
      const el = editorRef.current;
      if (!el) return;

      // 검색 중에는 포커스를 유지해 입력이 끊기지 않게 함
      if (options?.focus !== false) {
        el.focus();
      }
      el.setSelectionRange(start, end);

      const before = content.slice(0, start);
      const lineNumber = before.split("\n").length;
      const styles = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 28;
      el.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    },
    [content],
  );

  const jumpToMatch = useCallback(
    (start: number, end: number, options?: { focus?: boolean }) => {
      scrollToOffset(start, end, { focus: options?.focus ?? false });
    },
    [scrollToOffset],
  );

  const selectScene = useCallback(
    (scene: Scene) => {
      setActiveSceneId(scene.id);
      const block = chapterBlocks.find(
        (b) => b.chapterId === selectedChapterId,
      );
      const globalStart =
        (block?.bodyStartOffset ?? 0) + scene.startOffset;
      scrollToOffset(globalStart, globalStart);
    },
    [scrollToOffset, chapterBlocks, selectedChapterId],
  );

  // 전역 검색 딥링크: sceneId / offset
  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    deepLinkAppliedRef.current = false;
  }, [initialDocumentId, initialSceneId, initialOffset]);

  useEffect(() => {
    if (!isReady || documents.length === 0) return;
    if (deepLinkAppliedRef.current) return;

    if (initialDocumentId) {
      selectDocument(initialDocumentId as ChapterId);
    }

    if (initialSceneId && selectedChapterId) {
      const scene = scenes.find((s) => s.id === initialSceneId);
      if (scene) {
        deepLinkAppliedRef.current = true;
        selectScene(scene);
        return;
      }
    }

    if (typeof initialOffset === "number" && Number.isFinite(initialOffset)) {
      deepLinkAppliedRef.current = true;
      // initialOffset 은 Document 로컬 오프셋 (검색 딥링크)
      const docId = (initialDocumentId as ChapterId) || selectedChapterId;
      if (docId) {
        const global = chapterLocalToGlobalOffset(
          content,
          documents,
          docId,
          initialOffset,
        );
        const endLocal =
          typeof initialEnd === "number" && Number.isFinite(initialEnd)
            ? initialEnd
            : initialOffset;
        const globalEnd = chapterLocalToGlobalOffset(
          content,
          documents,
          docId,
          endLocal,
        );
        scrollToOffset(global, globalEnd, { focus: true });
      }
    }
  }, [
    isReady,
    documents,
    selectedChapterId,
    scenes,
    content,
    initialDocumentId,
    initialSceneId,
    initialOffset,
    initialEnd,
    selectDocument,
    selectScene,
    scrollToOffset,
  ]);

  const handleSaveVersion = useCallback(() => {
    void saveVersion(activeChapterBody);
  }, [saveVersion, activeChapterBody]);

  const handleRestoreVersion = useCallback(
    (version: ManuscriptVersion) => {
      if (!selectedChapterId) return;
      setChapterBody(selectedChapterId, version.content);
      setVersionModalOpen(false);
    },
    [selectedChapterId, setChapterBody],
  );

  const selectChapterFromOutline = useCallback(
    (chapterId: string, startOffset: number) => {
      selectDocument(chapterId as ChapterId);
      scrollToOffset(startOffset, startOffset);
    },
    [selectDocument, scrollToOffset],
  );

  return (
    <ContentContainer
      width="full"
      className={EDITOR_WIDTH_CLASS[settings.editorWidth]}
    >
      <header className="mb-ns-6 flex flex-col gap-ns-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">집필</p>
          <h2 className="ns-heading">Manuscript</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            프로젝트 전체 원고입니다. Chapter는 구분선으로만 나뉘며, ☰ 로
            순서를 바꿀 수 있습니다.
          </p>
        </div>
        {isReady ? (
          <div className="flex flex-col items-stretch gap-ns-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-ns-2">
              <ContextHelp topic="manuscript" projectId={projectId} />
              {selectedDocument ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={versionSaving}
                    onClick={handleSaveVersion}
                  >
                    {versionSaving ? "저장 중…" : "현재 버전 저장"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setVersionModalOpen(true)}
                  >
                    버전 기록
                    {versions.length > 0 ? ` (${versions.length})` : ""}
                  </Button>
                </>
              ) : null}
              <ContextHelp
                topic="export"
                projectId={projectId}
                label="Export 도움말"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setExportModalOpen(true)}
              >
                Export
              </Button>
            </div>
            <AutoSaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              className="sm:mb-1"
            />
          </div>
        ) : (
          <ContextHelp topic="manuscript" projectId={projectId} />
        )}
      </header>

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : documents.length === 0 ? (
        <EmptyDocumentsHint />
      ) : (
        <div className="grid grid-cols-1 gap-ns-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex min-w-0 flex-col gap-ns-4 lg:flex-row lg:items-start lg:gap-ns-4">
            <ChapterOutline
              chapters={documents}
              blocks={chapterBlocks}
              activeChapterId={selectedChapterId}
              onSelect={selectChapterFromOutline}
              onReorder={(a, b) => {
                void reorderDocuments(a, b);
              }}
            />

            <SceneNavigator
              scenes={scenes}
              activeSceneId={activeSceneId}
              collapsedIds={collapsedIds}
              onSelect={selectScene}
              onReorder={reorder}
              onAdd={() => add()}
              onDelete={remove}
              onRename={rename}
              onStatusChange={setStatus}
              onMemoChange={setMemo}
              onToggleCollapse={toggleCollapsed}
              onCollapseAll={() => setAllCollapsed(true)}
              onExpandAll={() => setAllCollapsed(false)}
              timelineHref={timelineHref}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-ns-4">
              <div className="flex flex-col gap-ns-1">
                <p className="text-ns-xs font-medium text-ns-accent">
                  프로젝트 전체 원고
                </p>
                <h3 className="text-ns-lg font-semibold text-ns-ink">
                  {selectedDocument
                    ? `포커스 · ${selectedDocument.title}`
                    : "Manuscript"}
                </h3>
                <p className="text-ns-sm text-ns-ink-secondary">
                  Chapter 구분선과 Scene(`#1`…)은 자동으로 관리됩니다.
                </p>
              </div>

              <SearchBar content={content} onJump={jumpToMatch} />

              <div className="relative">
                <InspirationGutter
                  content={content}
                  inspirations={gutterInspirations}
                  onOpen={(item) => setViewingInspiration(item)}
                  className="z-10 pt-ns-5"
                />
                <CharacterMentionField
                  value={content}
                  onChange={setContent}
                  characters={characters}
                  documentTitle="Manuscript"
                  editorRef={editorRef}
                  editorClassName="pl-10 font-mono text-[length:var(--ns-editor-font-size,1rem)]"
                  onOpenCharacter={(character) => setProfile(character)}
                />
                <InspirationSelectionMenu
                  textareaRef={editorRef}
                  enabled={documents.length > 0}
                  onAddInspiration={(selection) =>
                    setPendingSelection(selection)
                  }
                />
                <SentenceAssistantHost
                  textareaRef={editorRef}
                  enabled={documents.length > 0}
                />
              </div>
            </div>
          </div>

          <StatisticsPanel
            totalChars={stats.totalChars}
            charsWithoutSpaces={stats.charsWithoutSpaces}
            manuscriptSheets={stats.manuscriptSheets}
            bookPages={stats.bookPages}
            className="xl:sticky xl:top-ns-6"
          />
        </div>
      )}

      <CharacterFormModal
        open={Boolean(profile)}
        mode="edit"
        character={profile}
        onClose={() => setProfile(null)}
        onSubmit={(input) => {
          if (!profile) return;
          void (async () => {
            const updated = await updateCharacter(profile.id, input);
            if (updated) {
              setCharacters(await readCharactersByProject(projectId));
            }
            setProfile(null);
          })();
        }}
      />

      <InspirationModal
        open={Boolean(pendingSelection)}
        mode="create"
        selectedText={pendingSelection?.text}
        onClose={() => setPendingSelection(null)}
        onSubmit={(input) => {
          if (!pendingSelection) return;
          void (async () => {
            const mapped = globalOffsetToChapterLocal(
              content,
              documents,
              pendingSelection.start,
            );
            if (!mapped) return;
            const endMapped = globalOffsetToChapterLocal(
              content,
              documents,
              pendingSelection.end,
            );
            await createInspiration({
              documentId: mapped.chapterId,
              selectedText: pendingSelection.text,
              startOffset: mapped.localOffset,
              endOffset: endMapped?.localOffset ?? mapped.localOffset,
              workTitle: input.workTitle,
              author: input.author,
              memo: input.memo,
            });
            setPendingSelection(null);
            await refreshInspirations();
          })();
        }}
      />

      <InspirationModal
        open={Boolean(viewingInspiration)}
        mode="edit"
        inspiration={viewingInspiration}
        onClose={() => setViewingInspiration(null)}
        onSubmit={(input) => {
          if (!viewingInspiration) return;
          void (async () => {
            await updateInspiration(viewingInspiration.id, input);
            setViewingInspiration(null);
            await refreshInspirations();
          })();
        }}
        onDelete={() => {
          if (!viewingInspiration) return;
          setDeletingInspiration(viewingInspiration);
          setViewingInspiration(null);
        }}
      />

      <InspirationDeleteDialog
        open={Boolean(deletingInspiration)}
        inspiration={deletingInspiration}
        onClose={() => setDeletingInspiration(null)}
        onConfirm={(item) => {
          void (async () => {
            await removeInspiration(item.id);
            await refreshInspirations();
          })();
        }}
      />

      <ManuscriptVersionModal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        versions={versions}
        isLoading={versionsLoading}
        isSaving={versionSaving}
        error={versionError}
        currentContent={activeChapterBody}
        onSaveCurrent={handleSaveVersion}
        onRename={(id, name) => {
          void renameVersion(id, name);
        }}
        onRestore={handleRestoreVersion}
      />

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        projectId={projectId}
        chapterId={selectedChapterId}
        liveContent={activeChapterBody}
        scenes={scenes}
      />

      <AutoRecoveryDialog
        offer={recoveryOffer}
        showDiff={recoveryShowDiff}
        onToggleDiff={() => setRecoveryShowDiff(!recoveryShowDiff)}
        onAccept={acceptRecovery}
        onDiscard={discardRecovery}
      />
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
        먼저 Chapter가 필요합니다
      </p>
      <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
        Chapters 메뉴에서 Chapter를 만들면, Manuscript에 전체 원고로
        이어집니다.
      </p>
    </Card>
  );
}
