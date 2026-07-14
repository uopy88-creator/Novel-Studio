"use client";

/**
 * =============================================================================
 * ManuscriptWorkspace
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * 프로젝트당 하나의 원고를 편집한다 (집필 전용).
 * Section 구조 관리는 Section 페이지에서 한다.
 * Section 딥링크(?sectionId=)로 해당 오프셋까지 스크롤한다.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "@/features/characters/types/character";
import type { Inspiration } from "@/features/inspiration/types/inspiration";
import type { Section } from "@/features/manuscript/types/section";
import type { CharacterId, ProjectId } from "@/types/ids";
import { useManuscript } from "@/features/manuscript/hooks/useManuscript";
import { useManuscriptHistory } from "@/features/manuscript/hooks/useManuscriptHistory";
import { useSections } from "@/features/manuscript/hooks/useSections";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { updateCharacter } from "@/features/characters/lib/character-storage";
import { replaceMentionNameInText } from "@/features/characters/lib/mention";
import { CharacterMentionField } from "@/features/characters/components/CharacterMentionField";
import { CharacterFormModal } from "@/features/characters/components/CharacterFormModal";
import { useInspirations } from "@/features/inspiration/hooks/useInspirations";
import { InspirationGutter } from "@/features/inspiration/components/InspirationGutter";
import { InspirationModal } from "@/features/inspiration/components/InspirationModal";
import { findSectionStableIdAtOffset } from "@/features/sections";
import { InspirationDeleteDialog } from "@/features/inspiration/components/InspirationDeleteDialog";
import type { TextSelectionRange } from "@/features/inspiration/components/InspirationSelectionMenu";
import { createMemo } from "@/features/memo/lib/memo-storage";
import { MemoModal } from "@/features/memo/components/MemoModal";
import { SearchBar } from "@/features/manuscript/components/SearchBar";
import { StatisticsPanel } from "@/features/manuscript/components/StatisticsPanel";
import { AutoSaveIndicator } from "@/features/manuscript/components/AutoSaveIndicator";
import { ManuscriptVersionModal } from "@/features/manuscript/components/version-history";
import { useManuscriptVersions } from "@/features/manuscript/hooks/useManuscriptVersions";
import { useAutoRecovery } from "@/features/manuscript/hooks/useAutoRecovery";
import { AutoRecoveryDialog } from "@/features/manuscript/components/AutoRecoveryDialog";
import { ExportModal } from "@/features/export/components/ExportModal";
import {
  SentenceAssistantHost,
  type SentenceAssistantHostHandle,
} from "@/features/sentence-assistant";
import {
  QuickActions,
  createActionEngine,
  createActionRegistry,
  createInspirationSaveAction,
  createMemoSaveAction,
  createSentenceAssistantAction,
} from "@/features/quick-actions";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { ContentContainer } from "@/components/layout";
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
   * Section 페이지에서 항목을 누르면 이 경로로 이동한다.
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
    setContent: baseSetContent,
    saveStatus,
    lastSavedAt,
  } = useManuscript(projectId, initialDocumentId);

  const {
    setContent,
    setContentTransactional,
    replaceContent,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useManuscriptHistory(projectId, content, baseSetContent, isReady);

  // Export · 딥링크 스크롤 · `#`+Enter Section 생성
  const { sections, createAtCursor } = useSections(
    projectId,
    primaryDocumentId,
    content,
    setContentTransactional,
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
    setContent: replaceContent,
    saveStatus,
  });

  const {
    create: createInspiration,
    update: updateInspiration,
    remove: removeInspiration,
  } = useInspirations(projectId);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const sentenceAssistantRef = useRef<SentenceAssistantHostHandle>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [profileId, setProfileId] = useState<CharacterId | null>(null);
  const [mentionActive, setMentionActive] = useState(false);
  const [projectInspirations, setProjectInspirations] = useState<Inspiration[]>(
    [],
  );
  const [pendingSelection, setPendingSelection] =
    useState<TextSelectionRange | null>(null);
  const [pendingMemoSelection, setPendingMemoSelection] =
    useState<TextSelectionRange | null>(null);
  const [viewingInspiration, setViewingInspiration] =
    useState<Inspiration | null>(null);
  const [deletingInspiration, setDeletingInspiration] =
    useState<Inspiration | null>(null);
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

  // Quick Actions: Registry 에 Action 등록 → UI 버튼 자동 생성 (하드코딩 없음)
  const quickActionEngine = useMemo(() => {
    const registry = createActionRegistry([
      createSentenceAssistantAction({
        openAssistant: (selection) => {
          sentenceAssistantRef.current?.openFromSelection(selection);
        },
      }),
      createInspirationSaveAction({
        saveInspiration: (selection) => {
          setPendingSelection(selection);
        },
      }),
      createMemoSaveAction({
        openMemo: (selection) => {
          setPendingMemoSelection(selection);
        },
      }),
    ]);
    return createActionEngine(registry);
  }, []);

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

  /** Section 페이지 / 검색 딥링크 → 해당 구간으로 스크롤 */
  const selectSection = useCallback(
    (section: Section) => {
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
      replaceContent(version.content);
      setVersionModalOpen(false);
    },
    [replaceContent],
  );

  // Undo / Redo 단축키 (Ctrl/⌘+Z, Ctrl/⌘+Shift+Z)
  useEffect(() => {
    if (!isReady) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      // 다른 입력란(검색 등)에서는 브라우저 기본 Undo 유지
      const inEditor =
        target === editorRef.current ||
        (tag === "textarea" && target?.closest("[data-manuscript-editor]"));
      if (!inEditor) return;

      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undo();
        return;
      }
      if (key === "y" && !event.metaKey) {
        // Windows Ctrl+Y = Redo
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isReady, undo, redo]);

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
            프로젝트 전체 원고를 이어서 씁니다. 구간 추가·순서·상태는 Section
            페이지에서 관리합니다.
          </p>
        </div>
        {isReady ? (
          <div className="flex flex-col items-stretch gap-ns-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-ns-2">
              {/* Undo / Redo — 툴바 왼쪽 */}
              <div
                className="mr-ns-1 flex items-center gap-ns-1"
                role="group"
                aria-label="실행 취소"
              >
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canUndo}
                  onClick={undo}
                  title="실행 취소 (Ctrl+Z)"
                  aria-label="Undo"
                >
                  ↶ Undo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canRedo}
                  onClick={redo}
                  title="다시 실행 (Ctrl+Shift+Z)"
                  aria-label="Redo"
                >
                  ↷ Redo
                </Button>
              </div>
              {/*
               * TODO:
               * Implement lightweight text annotations without affecting typing performance.
               * (이전 인라인 마커+오버레이 방식은 입력 지연을 유발해 제거함.
               *  재도입 시 본문 문자열과 분리된 경량 메타데이터를 검토할 것.)
               */}
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
          <div className="flex min-w-0 flex-col gap-ns-4">
            <div className="flex flex-col gap-ns-1">
              <p className="text-ns-xs font-medium text-ns-accent">
                프로젝트 전체 원고
              </p>
              <h3 className="text-ns-lg font-semibold text-ns-ink">
                Manuscript
              </h3>
              <p className="text-ns-sm text-ns-ink-secondary">
                Section(`#1`…) 구조는 사이드바의 Section 페이지에서 관리합니다.
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
                onSectionBreak={(cursorOffset) => {
                  // `#` + Enter → createSection 공통 로직 (번호 자동 부여)
                  const result = createAtCursor(cursorOffset);
                  if (!result) return null;
                  return { caretOffset: result.caretOffset };
                }}
              />
              <QuickActions
                textareaRef={editorRef}
                engine={quickActionEngine}
                enabled={Boolean(primaryDocumentId) && !mentionActive}
              />
              <SentenceAssistantHost
                ref={sentenceAssistantRef}
                textareaRef={editorRef}
                projectId={projectId}
                enabled={Boolean(primaryDocumentId)}
                onReplaceSelection={(nextContent, caretStart, caretEnd) => {
                  // 한 번의 transactional 편집 → Undo/Redo · 기존 autosave 경로
                  setContentTransactional(nextContent);
                  requestAnimationFrame(() => {
                    const el = editorRef.current;
                    if (!el) return;
                    el.focus();
                    // 커서는 교체된 단어 뒤 (collapsed)
                    el.setSelectionRange(caretStart, caretEnd);
                  });
                }}
              />
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
              setContentTransactional(
                replaceMentionNameInText(content, oldName, newName),
              );
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
              sectionStableId:
                findSectionStableIdAtOffset(
                  content,
                  pendingSelection.start,
                ) ?? undefined,
              workTitle: input.workTitle,
              author: input.author,
              memo: input.memo,
            });
            setPendingSelection(null);
            await refreshInspirations();
          })();
        }}
      />

      <MemoModal
        open={Boolean(pendingMemoSelection)}
        mode="create"
        initialBody={pendingMemoSelection?.text ?? ""}
        onClose={() => setPendingMemoSelection(null)}
        onSubmit={async (input) => {
          if (!pendingMemoSelection) return;
          await createMemo(projectId, {
            body: input.body,
            isPinned: input.isPinned,
            kind: "note",
            sourceText: pendingMemoSelection.text,
            sectionStableId:
              findSectionStableIdAtOffset(
                content,
                pendingMemoSelection.start,
              ) ?? undefined,
          });
          setPendingMemoSelection(null);
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
