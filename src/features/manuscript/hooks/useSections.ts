"use client";

/**
 * =============================================================================
 * useSections
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * - 원고 content → Section 파싱 (프로그램이 관리하는 내부 마커)
 * - status / memo / icons / 접힘 → section metas
 * - 순서·제목·추가·삭제는 content 재직렬화 → Manuscript autosave
 *
 * Section 구조 관리는 Section 페이지에서, Manuscript 는 집필·딥링크 스크롤용.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Section,
  SectionIconId,
  SectionIcons,
  SectionStatus,
} from "@/features/manuscript/types/section";
import {
  DEFAULT_SECTION_DELIMITER,
  EMPTY_SECTION_ICONS,
} from "@/features/manuscript/types/section";
import type { ChapterId, ProjectId } from "@/types/ids";
import { parseSections } from "@/features/manuscript/lib/section-parser";
import {
  applySectionsToContent,
  createSection,
  createSectionAtCursor,
  deleteSection,
  renameSection,
  reorderSections,
  type SectionDeleteMode,
} from "@/features/manuscript/lib/section-operations";
import { readSectionDelimiterConfig } from "@/features/manuscript/lib/section-delimiter-settings";
import {
  collapsedIdsFromMetas,
  readSectionMetasByDocument,
  saveSectionMetasForDocument,
  withSectionIconToggle,
  withSectionIcons,
  withSectionMemo,
  withSectionStatus,
} from "@/features/manuscript/lib/section-meta-storage";
import {
  isEmptyManuscriptContent,
  publishSections,
  sectionRefsFromSections,
} from "@/features/sections";

type MetaSlice = {
  status: SectionStatus;
  memo: string;
  icons: SectionIcons;
};

export interface UseSectionsResult {
  sections: Section[];
  collapsedIds: Set<string>;
  metaReady: boolean;
  toggleCollapsed: (sectionId: string) => void;
  setAllCollapsed: (collapsed: boolean) => void;
  reorder: (activeId: string, overId: string) => void;
  /** 선택한 Section 아래(또는 맨 끝)에 추가. 새 Section 안정 ID 반환 */
  add: (afterIndex?: number) => string | null;
  /**
   * Manuscript 커서에서 `#` + Enter 로 Section 생성.
   * 성공 시 새 캐럿 위치 반환 (실패 시 null).
   */
  createAtCursor: (
    cursorOffset: number,
  ) => { sectionId: string; caretOffset: number } | null;
  remove: (sectionId: string, mode?: SectionDeleteMode) => void;
  rename: (sectionId: string, title: string) => void;
  setStatus: (sectionId: string, status: SectionStatus) => void;
  setMemo: (sectionId: string, memo: string) => void;
  toggleIcon: (sectionId: string, iconId: SectionIconId) => void;
  setIcons: (sectionId: string, icons: SectionIcons) => void;
}

const META_SAVE_MS = 500;

export function useSections(
  projectId: ProjectId,
  documentId: ChapterId | null,
  content: string,
  setContent: (value: string) => void,
): UseSectionsResult {
  const config = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_SECTION_DELIMITER;
    return readSectionDelimiterConfig();
  }, []);

  const [metaByNumber, setMetaByNumber] = useState<Map<number, MetaSlice>>(
    () => new Map(),
  );
  const [collapsedStableIds, setCollapsedStableIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [metaReady, setMetaReady] = useState(false);
  const pendingCollapseNumbersRef = useRef<Set<number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMetaReady(false);

    if (!documentId) {
      setMetaByNumber(new Map());
      setCollapsedStableIds(new Set());
      pendingCollapseNumbersRef.current = null;
      setMetaReady(true);
      return;
    }

    void (async () => {
      try {
        const metas = await readSectionMetasByDocument(documentId);
        if (cancelled) return;
        setMetaByNumber(
          new Map(
            metas.map((m) => [
              m.sectionNumber,
              {
                status: m.status,
                memo: m.memo,
                icons: m.icons ?? { ...EMPTY_SECTION_ICONS },
              },
            ]),
          ),
        );
        pendingCollapseNumbersRef.current = collapsedIdsFromMetas(metas);
        setCollapsedStableIds(new Set());
        setMetaReady(true);
      } catch (error) {
        console.error("[useSections] section meta load failed", error);
        if (cancelled) return;
        setMetaByNumber(new Map());
        setCollapsedStableIds(new Set());
        pendingCollapseNumbersRef.current = null;
        setMetaReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const parsed = useMemo(
    () => parseSections(content, config),
    [content, config],
  );

  const sections = useMemo(
    () =>
      parsed.map((section) => {
        const meta = metaByNumber.get(section.number);
        return {
          ...section,
          status: meta?.status ?? section.status,
          memo: meta?.memo ?? section.memo,
          icons: meta?.icons ?? section.icons ?? { ...EMPTY_SECTION_ICONS },
        };
      }),
    [parsed, metaByNumber],
  );

  // Section Registry (SSOT) — Manuscript 가 관리, Timeline 등은 구독만
  useEffect(() => {
    const refs = isEmptyManuscriptContent(content)
      ? []
      : sectionRefsFromSections(sections);
    publishSections(projectId, {
      sections: refs,
      primaryDocumentId: documentId,
      source: "live",
    });
  }, [projectId, documentId, content, sections]);

  useEffect(() => {
    const pending = pendingCollapseNumbersRef.current;
    if (!pending || sections.length === 0) return;
    const next = new Set<string>();
    for (const section of sections) {
      if (pending.has(section.number)) next.add(section.id);
    }
    setCollapsedStableIds(next);
    pendingCollapseNumbersRef.current = null;
  }, [sections]);

  const collapsedIds = collapsedStableIds;

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const collapsedRef = useRef(collapsedStableIds);
  collapsedRef.current = collapsedStableIds;
  const metaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistMetas = useCallback(
    (nextSections: Section[], nextCollapsed: Set<string>) => {
      if (!documentId) return;
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
      metaTimerRef.current = setTimeout(() => {
        const collapsedNumbers = new Set<number>();
        for (const section of nextSections) {
          if (nextCollapsed.has(section.id)) {
            collapsedNumbers.add(section.number);
          }
        }
        void saveSectionMetasForDocument({
          projectId,
          documentId,
          sections: nextSections,
          collapsedNumbers,
        }).catch((error) => {
          console.error("[useSections] section meta save failed", error);
        });
      }, META_SAVE_MS);
    },
    [documentId, projectId],
  );

  const syncMetaStateFromSections = useCallback((next: Section[]) => {
    setMetaByNumber(
      new Map(
        next.map((s) => [
          s.number,
          {
            status: s.status,
            memo: s.memo,
            icons: s.icons ?? { ...EMPTY_SECTION_ICONS },
          },
        ]),
      ),
    );
  }, []);

  const commitContent = useCallback(
    (next: Section[]) => {
      const nextCollapsed = new Set<string>();
      for (const section of next) {
        if (collapsedRef.current.has(section.id)) {
          nextCollapsed.add(section.id);
        }
      }

      setContent(applySectionsToContent(next, config));
      syncMetaStateFromSections(next);
      setCollapsedStableIds(nextCollapsed);
      persistMetas(next, nextCollapsed);
    },
    [config, persistMetas, setContent, syncMetaStateFromSections],
  );

  const toggleCollapsed = useCallback(
    (sectionId: string) => {
      setCollapsedStableIds((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        persistMetas(sectionsRef.current, next);
        return next;
      });
    },
    [persistMetas],
  );

  const setAllCollapsed = useCallback(
    (collapsed: boolean) => {
      const next = collapsed
        ? new Set(sectionsRef.current.map((s) => s.id))
        : new Set<string>();
      setCollapsedStableIds(next);
      persistMetas(sectionsRef.current, next);
    },
    [persistMetas],
  );

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      commitContent(reorderSections(sectionsRef.current, activeId, overId));
    },
    [commitContent],
  );

  const add = useCallback(
    (afterIndex?: number) => {
      // 「+ 새 Section」— createSection 공통 로직
      const { sections: next, newSectionId } = createSection(
        sectionsRef.current,
        { afterIndex },
      );
      commitContent(next);
      return newSectionId;
    },
    [commitContent],
  );

  /**
   * Manuscript `#` + Enter.
   * createSectionAtCursor → 메타 병합 → commit (번호 자동 재부여).
   */
  const createAtCursor = useCallback(
    (cursorOffset: number) => {
      const result = createSectionAtCursor(content, cursorOffset, config);
      if (!result) return null;

      // 기존 Section 메타(status/memo/icons) 보존
      const withMeta = result.sections.map((section) => {
        const prev = sectionsRef.current.find((s) => s.id === section.id);
        if (!prev) return section;
        return {
          ...section,
          status: prev.status,
          memo: prev.memo,
          icons: prev.icons ?? section.icons,
        };
      });

      commitContent(withMeta);
      return {
        sectionId: result.newSectionId,
        caretOffset: result.caretOffset,
      };
    },
    [commitContent, config, content],
  );

  const remove = useCallback(
    (sectionId: string, mode: SectionDeleteMode = "full") => {
      commitContent(deleteSection(sectionsRef.current, sectionId, mode));
    },
    [commitContent],
  );

  const rename = useCallback(
    (sectionId: string, title: string) => {
      commitContent(renameSection(sectionsRef.current, sectionId, title));
    },
    [commitContent],
  );

  const setStatus = useCallback(
    (sectionId: string, status: SectionStatus) => {
      const next = withSectionStatus(sectionsRef.current, sectionId, status);
      syncMetaStateFromSections(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromSections],
  );

  const setMemo = useCallback(
    (sectionId: string, memo: string) => {
      const next = withSectionMemo(sectionsRef.current, sectionId, memo);
      syncMetaStateFromSections(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromSections],
  );

  const toggleIcon = useCallback(
    (sectionId: string, iconId: SectionIconId) => {
      const next = withSectionIconToggle(
        sectionsRef.current,
        sectionId,
        iconId,
      );
      syncMetaStateFromSections(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromSections],
  );

  const setIcons = useCallback(
    (sectionId: string, icons: SectionIcons) => {
      const next = withSectionIcons(sectionsRef.current, sectionId, icons);
      syncMetaStateFromSections(next);
      persistMetas(next, collapsedRef.current);
    },
    [persistMetas, syncMetaStateFromSections],
  );

  useEffect(() => {
    return () => {
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
    };
  }, []);

  return {
    sections,
    collapsedIds,
    metaReady,
    toggleCollapsed,
    setAllCollapsed,
    reorder,
    add,
    createAtCursor,
    remove,
    rename,
    setStatus,
    setMemo,
    toggleIcon,
    setIcons,
  };
}
