"use client";

/**
 * =============================================================================
 * ManuscriptWorkspace
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * 프로젝트당 하나의 원고를 편집한다.
 * Section Navigator (#1 #2 …) 로 구간을 관리한다.
 * Chapter Outline / Chapter 생성 UI 는 없다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { Section } from "@/features/manuscript/types/section";
import type { CharacterId, ProjectId } from "@/types/ids";
import { useManuscript } from "@/features/manuscript/hooks/useManuscript";
import { useSections } from "@/features/manuscript/hooks/useSections";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { updateCharacter } from "@/features/characters/lib/character-storage";
import { replaceMentionNameInText } from "@/features/characters/lib/mention";
import { CharacterMentionField } from "@/features/characters/components/CharacterMentionField";
import { CharacterFormModal } from "@/features/characters/components/CharacterFormModal";
import { useInspirations } from "@/features/inspiration/hooks/useInspirations";
import { InspirationSelectionMenu } from "@/features/inspiration/components/InspirationSelectionMenu";
import { InspirationGutter } from "@/features/inspiration/components/InspirationGutter";
import { InspirationModal } from "@/features/inspiration/components/InspirationModal";
import { InspirationDeleteDialog } from "@/features/inspiration/components/InspirationDeleteDialog";
import type { TextSelectionRange } from "@/features/inspiration/components/InspirationSelectionMenu";
import { SectionNavigator } from "@/features/manuscript/components/section-navigator";
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
import { ContentContainer } from "@/components/layout";
import { studioPath } from "@/components/layout/nav-items";
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
  /**
   * Section 안정 ID 딥링크.
   * 레거시 `?sceneId=` 와 신규 `?sectionId=` 모두 이 prop 으로 전달된다.
   */
  initialSectionId?: string;
  /** @deprecated Use initialSectionId */
  initialSceneId?: string;
}

export function ManuscriptWorkspace({
  projectId,
  initialDocumentId,
  initialOffset,
  initialEnd,
  initialSectionId,
  initialSceneId,
}: ManuscriptWorkspaceProps) {
  const sectionDeepLink = initialSectionId ?? initialSceneId;
  const { settings } = useUserSettings();

  const {
    isReady,
    primaryDocumentId,
    selectedChapterId,
    content,
    setContent,
    saveStatus,
    lastSavedAt,
  } = useManuscript(projectId, initialDocumentId);

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
  } = useSections(projectId, primaryDocumentId, content, setContent);

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
  const [profileId, setProfileId] = useState<CharacterId | null>(null);
  const [mentionActive, setMentionActive] = useState(false);
  const [projectInspirations, setProjectInspirations] = useState<Inspiration[]>(
    [],
  );
  const [pendingSelection, setPendingSelection] =
    useState<TextSelectionRange | null>(null);
  const [viewingInspiration, setViewingInspiration] =
    useState<Inspiration | null>(null);
  const [deletingInspiration, setDeletingInspiration] =
    useState<Inspiration | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
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

  // 열린 프로필은 스냅샷이 아니라 live characters 에서 id 로 해석
  const profileCharacter = useMemo(
    () =>
      profileId
        ? (characters.find((character) => character.id === profileId) ?? null)
        : null,
    [characters, profileId],
  );

  const refreshInspirations = useCallback(async () => {
    setProjectInspirations(await readInspirationsByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    void refreshInspirations();
  }, [refreshInspirations, content]);

  /** Inspiration 오프셋은 이미 프로젝트 원고 좌표로 저장 (마이그레이션 후) */
  const gutterInspirations = useMemo(
    () => projectInspirations,
    [projectInspirations],
  );

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSectionId(null);
      return;
    }
    setActiveSectionId((current) => {
      if (current && sections.some((s) => s.id === current)) return current;
      return sections[0].id;
    });
  }, [sections]);

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

  const timelineHref = useMemo(() => {
    if (!primaryDocumentId || !activeSectionId) return null;
    const params = new URLSearchParams({
      documentId: primaryDocumentId,
      sectionId: activeSectionId,
      // 레거시 호환
      sceneId: activeSectionId,
    });
    return `${studioPath(projectId, "timeline")}?${params.toString()}`;
  }, [projectId, primaryDocumentId, activeSectionId]);

  const scrollToOffset = useCallback(
    (
      start: number,
      end = start,
      options?: { focus?: boolean },
    ) => {
      const el = editorRef.current;
      if (!el) return;

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

  const selectSection = useCallback(
    (section: Section) => {
      setActiveSectionId(section.id);
      scrollToOffset(section.startOffset, section.startOffset);
    },
    [scrollToOffset],
  );

  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    deepLinkAppliedRef.current = false;
  }, [initialDocumentId, sectionDeepLink, initialOffset]);

  useEffect(() => {
    if (!isReady || !primaryDocumentId) return;
    if (deepLinkAppliedRef.current) return;

    if (sectionDeepLink) {
      const section = sections.find((s) => s.id === sectionDeepLink);
      if (section) {
        deepLinkAppliedRef.current = true;
        selectSection(section);
        return;
      }
    }

    if (typeof initialOffset === "number" && Number.isFinite(initialOffset)) {
      deepLinkAppliedRef.current = true;
      const end =
        typeof initialEnd === "number" && Number.isFinite(initialEnd)
          ? initialEnd
          : initialOffset;
      scrollToOffset(initialOffset, end, { focus: true });
    }
  }, [
    isReady,
    primaryDocumentId,
    sections,
    sectionDeepLink,
    initialOffset,
    initialEnd,
    selectSection,
    scrollToOffset,
  ]);

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
    <ContentContainer
      width="full"
      className={EDITOR_WIDTH_CLASS[settings.editorWidth]}
    >
      <header className="mb-ns-6 flex flex-col gap-ns-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">집필</p>
          <h2 className="ns-heading">Manuscript</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            프로젝트 전체 원고입니다. Section Navigator로 구간을 나누고
            순서를 바꿀 수 있습니다.
          </p>
        </div>
        {isReady ? (
          <div className="flex flex-col items-stretch gap-ns-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-ns-2">
              <ContextHelp topic="manuscript" projectId={projectId} />
              {primaryDocumentId ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-ns-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex min-w-0 flex-col gap-ns-4 lg:flex-row lg:items-start lg:gap-ns-4">
            <SectionNavigator
              sections={sections}
              activeSectionId={activeSectionId}
              collapsedIds={collapsedIds}
              onSelect={selectSection}
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
                  Manuscript
                </h3>
                <p className="text-ns-sm text-ns-ink-secondary">
                  Section(`#1`…)은 Navigator에서 자동으로 관리됩니다.
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
                  onOpenCharacter={(character) => setProfileId(character.id)}
                  onMentionActiveChange={setMentionActive}
                />
                <InspirationSelectionMenu
                  textareaRef={editorRef}
                  enabled={Boolean(primaryDocumentId) && !mentionActive}
                  onAddInspiration={(selection) =>
                    setPendingSelection(selection)
                  }
                />
                <SentenceAssistantHost
                  textareaRef={editorRef}
                  enabled={Boolean(primaryDocumentId)}
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
        open={Boolean(profileCharacter)}
        mode="edit"
        character={profileCharacter}
        onClose={() => setProfileId(null)}
        onSubmit={(input) => {
          if (!profileCharacter) return;
          void (async () => {
            const oldName = profileCharacter.name;
            const newName = input.name.trim();
            if (oldName !== newName) {
              setContent(replaceMentionNameInText(content, oldName, newName));
            }
            const updated = await updateCharacter(profileCharacter.id, input);
            if (updated) {
              setCharacters(await readCharactersByProject(projectId));
            }
            setProfileId(null);
          })();
        }}
      />

      <InspirationModal
        open={Boolean(pendingSelection)}
        mode="create"
        selectedText={pendingSelection?.text}
        onClose={() => setPendingSelection(null)}
        onSubmit={(input) => {
          if (!pendingSelection || !primaryDocumentId) return;
          void (async () => {
            await createInspiration({
              documentId: primaryDocumentId,
              selectedText: pendingSelection.text,
              startOffset: pendingSelection.start,
              endOffset: pendingSelection.end,
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
        currentContent={content}
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
        chapterId={primaryDocumentId}
        liveContent={content}
        scenes={sections}
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
