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
import { SearchBar } from "@/features/manuscript/components/SearchBar";
import { StatisticsPanel } from "@/features/manuscript/components/StatisticsPanel";
import { AutoSaveIndicator } from "@/features/manuscript/components/AutoSaveIndicator";
import { ManuscriptVersionModal } from "@/features/manuscript/components/version-history";
import { useManuscriptVersions } from "@/features/manuscript/hooks/useManuscriptVersions";
import { DOCUMENT_KIND_LABELS } from "@/features/manuscript/types/chapter";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { ContentContainer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  countCharsWithoutSpaces,
  countCharsWithSpaces,
  estimateBookPages,
  estimateManuscriptSheets,
} from "@/lib/stats";
import { cn } from "@/lib/utils/cn";

export interface ManuscriptWorkspaceProps {
  projectId: ProjectId;
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
  } = useScenes(projectId, selectedChapterId, content, setContent);

  const {
    versions,
    isLoading: versionsLoading,
    isSaving: versionSaving,
    error: versionError,
    saveCurrent: saveVersion,
    rename: renameVersion,
  } = useManuscriptVersions(projectId, selectedChapterId);

  const {
    create: createInspiration,
    update: updateInspiration,
    remove: removeInspiration,
    listByDocument,
  } = useInspirations(projectId);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [profile, setProfile] = useState<Character | null>(null);
  const [docInspirations, setDocInspirations] = useState<Inspiration[]>([]);
  const [pendingSelection, setPendingSelection] =
    useState<TextSelectionRange | null>(null);
  const [viewingInspiration, setViewingInspiration] =
    useState<Inspiration | null>(null);
  const [deletingInspiration, setDeletingInspiration] =
    useState<Inspiration | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);

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

  const refreshDocInspirations = useCallback(async () => {
    if (!selectedChapterId) {
      setDocInspirations([]);
      return;
    }
    setDocInspirations(await listByDocument(selectedChapterId));
  }, [listByDocument, selectedChapterId]);

  useEffect(() => {
    void refreshDocInspirations();
  }, [refreshDocInspirations]);

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
      bookPages: estimateBookPages(charsWithoutSpaces),
    };
  }, [content]);

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
      // 최신 content 기준으로 오프셋 재계산된 scene 사용
      scrollToOffset(scene.startOffset, scene.startOffset);
    },
    [scrollToOffset],
  );

  const handleSaveVersion = useCallback(() => {
    void saveVersion(content);
  }, [saveVersion, content]);

  const handleRestoreVersion = useCallback(
    (version: ManuscriptVersion) => {
      setContent(version.content);
      setVersionModalOpen(false);
    },
    [setContent],
  );

  return (
    <ContentContainer width="full" className="max-w-7xl">
      <header className="mb-ns-6 flex flex-col gap-ns-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">집필</p>
          <h2 className="ns-heading">Manuscript</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            `#1` `#2` 로 Scene을 나누고, 왼쪽 Navigator에서 순서를 바꿀 수
            있습니다.
          </p>
        </div>
        {selectedDocument || isReady ? (
          <div className="flex flex-col items-stretch gap-ns-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-ns-2">
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
            </div>
            {selectedDocument ? (
              <AutoSaveIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                className="sm:mb-1"
              />
            ) : null}
          </div>
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
              <div className="flex min-w-0 flex-col gap-ns-4 lg:flex-row lg:items-start lg:gap-ns-4">
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
                />

                <div className="flex min-w-0 flex-1 flex-col gap-ns-4">
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

                  <div className="relative">
                    <InspirationGutter
                      content={content}
                      inspirations={docInspirations}
                      onOpen={(item) => setViewingInspiration(item)}
                      className="z-10 pt-ns-5"
                    />
                    <CharacterMentionField
                      value={content}
                      onChange={setContent}
                      characters={characters}
                      documentTitle={selectedDocument.title}
                      editorRef={editorRef}
                      editorClassName="pl-10"
                      onOpenCharacter={(character) => setProfile(character)}
                    />
                    <InspirationSelectionMenu
                      textareaRef={editorRef}
                      enabled={Boolean(selectedDocument)}
                      onAddInspiration={(selection) =>
                        setPendingSelection(selection)
                      }
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
          if (!pendingSelection || !selectedChapterId) return;
          void (async () => {
            await createInspiration({
              documentId: selectedChapterId,
              selectedText: pendingSelection.text,
              startOffset: pendingSelection.start,
              endOffset: pendingSelection.end,
              workTitle: input.workTitle,
              author: input.author,
              memo: input.memo,
            });
            setPendingSelection(null);
            await refreshDocInspirations();
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
            await refreshDocInspirations();
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
            await refreshDocInspirations();
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
        currentContent={content}
        onSaveCurrent={handleSaveVersion}
        onRename={(id, name) => {
          void renameVersion(id, name);
        }}
        onRestore={handleRestoreVersion}
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
        먼저 Document가 필요합니다
      </p>
      <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
        Chapters 메뉴에서 Document를 만든 뒤 여기서 원고를 작성하세요. 본문에
        `#1` `#2` 를 넣으면 Scene Navigator에 나타납니다.
      </p>
    </Card>
  );
}
