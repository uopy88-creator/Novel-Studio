/**
 * =============================================================================
 * Section Meta Storage — Supabase Database 단일 소스
 * -----------------------------------------------------------------------------
 * 상태·메모·접힘 (원고와 분리, export 제외).
 * LocalStorage: SECTION_METAS_STORAGE_KEY 에 쓰고,
 * 레거시 SCENE_METAS_STORAGE_KEY 는 최초 읽기 시 마이그레이션한다.
 * =============================================================================
 */

import type {
  Section,
  SectionIcons,
  SectionIconId,
  SectionMeta,
  SectionStatus,
} from "@/features/manuscript/types/section";
import {
  EMPTY_SECTION_ICONS,
} from "@/features/manuscript/types/section";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudListSectionMetasByDocument,
  cloudReplaceSectionMetas,
} from "@/database/supabase/section-metas-repo";
import {
  SECTION_METAS_STORAGE_KEY,
  SCENE_METAS_STORAGE_KEY,
} from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import {
  nowIso,
  readJsonArray,
  writeJsonArray,
  readStorageString,
} from "@/lib/storage/browser";

export { SECTION_METAS_STORAGE_KEY };

/** 레거시 로컬 행 — sceneNumber 또는 sectionNumber */
type RawMeta = Partial<SectionMeta> & {
  sceneNumber?: number;
  sectionNumber?: number;
  icons?: unknown;
};

/** icons jsonb / 객체 → SectionIcons (없거나 깨진 값은 전부) */
export function normalizeSectionIcons(raw: unknown): SectionIcons {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SECTION_ICONS };
  }
  const o = raw as Record<string, unknown>;
  return {
    important: Boolean(o.important),
    foreshadowing: Boolean(o.foreshadowing),
    dialogue: Boolean(o.dialogue),
  };
}

function normalizeMeta(raw: RawMeta): SectionMeta | null {
  if (!raw || typeof raw.id !== "string") return null;
  if (typeof raw.projectId !== "string" || typeof raw.documentId !== "string") {
    return null;
  }
  const sectionNumber =
    typeof raw.sectionNumber === "number"
      ? raw.sectionNumber
      : typeof raw.sceneNumber === "number"
        ? raw.sceneNumber
        : null;
  if (sectionNumber === null) return null;

  const status = (["draft", "editing", "done"] as SectionStatus[]).includes(
    raw.status as SectionStatus,
  )
    ? (raw.status as SectionStatus)
    : "draft";

  return {
    id: raw.id,
    projectId: raw.projectId,
    documentId: raw.documentId,
    sectionNumber,
    status,
    memo: typeof raw.memo === "string" ? raw.memo : "",
    icons: normalizeSectionIcons(raw.icons),
    isCollapsed: Boolean(raw.isCollapsed),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso(),
  };
}

/**
 * 레거시 scene-metas → section-metas 일회 이전.
 * 새 키가 비어 있고 옛 키에 데이터가 있으면 복사한다.
 */
function migrateLocalSceneMetasIfNeeded(): void {
  if (typeof window === "undefined") return;
  const existing = readStorageString(SECTION_METAS_STORAGE_KEY);
  if (existing && existing !== "[]") return;

  const legacy = readStorageString(SCENE_METAS_STORAGE_KEY);
  if (!legacy || legacy === "[]") return;

  try {
    const parsed = JSON.parse(legacy) as RawMeta[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    const normalized = parsed
      .map(normalizeMeta)
      .filter((m): m is SectionMeta => m !== null);
    writeJsonArray(SECTION_METAS_STORAGE_KEY, normalized);
  } catch {
    // ignore bad legacy payload
  }
}

function readLocalAll(): SectionMeta[] {
  migrateLocalSceneMetasIfNeeded();
  return readJsonArray<RawMeta>(SECTION_METAS_STORAGE_KEY)
    .map(normalizeMeta)
    .filter((m): m is SectionMeta => m !== null);
}

function writeLocalAll(metas: SectionMeta[]): void {
  writeJsonArray(SECTION_METAS_STORAGE_KEY, metas);
}

function readLocalByDocument(documentId: ChapterId): SectionMeta[] {
  return readLocalAll().filter((m) => m.documentId === documentId);
}

function backupSectionMetasForDocument(
  documentId: ChapterId,
  list: SectionMeta[],
): void {
  // 문서 단위 백업이 전체 키를 덮어쓰지 않도록 다른 document 메타와 병합
  const others = readLocalAll().filter((m) => m.documentId !== documentId);
  writeWorkDataBackup(SECTION_METAS_STORAGE_KEY, [...others, ...list]);
}

export function createSectionMetaId(): string {
  return crypto.randomUUID();
}

export async function readSectionMetasByDocument(
  documentId: ChapterId,
): Promise<SectionMeta[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const list = await cloudListSectionMetasByDocument(documentId);
    try {
      backupSectionMetasForDocument(documentId, list);
    } catch {
      // 백업 실패 무시
    }
    return list;
  }
  return readLocalByDocument(documentId);
}

/**
 * 파싱된 Section 목록에 메타를 합친다.
 * 번호(sectionNumber) 기준으로 매칭한다.
 */
export function mergeSectionsWithMetas(
  sections: Section[],
  metas: SectionMeta[],
): Section[] {
  const byNumber = new Map(metas.map((m) => [m.sectionNumber, m]));
  return sections.map((section) => {
    const meta = byNumber.get(section.number);
    return {
      ...section,
      status: meta?.status ?? "draft",
      memo: meta?.memo ?? "",
      icons: meta?.icons ?? { ...EMPTY_SECTION_ICONS },
    };
  });
}

export function collapsedIdsFromMetas(metas: SectionMeta[]): Set<number> {
  return new Set(
    metas.filter((m) => m.isCollapsed).map((m) => m.sectionNumber),
  );
}

/** Section[] + 접힘 상태 → SectionMeta[] 로 변환해 저장 */
export async function saveSectionMetasForDocument(input: {
  projectId: ProjectId;
  documentId: ChapterId;
  sections: Section[];
  collapsedNumbers: Set<number>;
}): Promise<SectionMeta[]> {
  const { projectId, documentId, sections, collapsedNumbers } = input;
  const existing = await readSectionMetasByDocument(documentId);
  const existingByNumber = new Map(existing.map((m) => [m.sectionNumber, m]));
  const timestamp = nowIso();

  const metas: SectionMeta[] = sections.map((section) => {
    const prev = existingByNumber.get(section.number);
    return {
      id: prev?.id ?? createSectionMetaId(),
      projectId,
      documentId,
      sectionNumber: section.number,
      status: section.status,
      memo: section.memo,
      icons: section.icons ?? { ...EMPTY_SECTION_ICONS },
      isCollapsed: collapsedNumbers.has(section.number),
      createdAt: prev?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  });

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    await cloudReplaceSectionMetas(metas);
    try {
      backupSectionMetasForDocument(documentId, metas);
    } catch {
      // 백업 실패 무시
    }
    return metas;
  }

  const others = readLocalAll().filter((m) => m.documentId !== documentId);
  writeLocalAll([...others, ...metas]);
  return metas;
}

export function withSectionStatus(
  sections: Section[],
  sectionId: string,
  status: SectionStatus,
): Section[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, status } : s));
}

export function withSectionMemo(
  sections: Section[],
  sectionId: string,
  memo: string,
): Section[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, memo } : s));
}

export function withSectionIconToggle(
  sections: Section[],
  sectionId: string,
  iconId: SectionIconId,
): Section[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s;
    const icons = s.icons ?? { ...EMPTY_SECTION_ICONS };
    return {
      ...s,
      icons: { ...icons, [iconId]: !icons[iconId] },
    };
  });
}

export function withSectionIcons(
  sections: Section[],
  sectionId: string,
  icons: SectionIcons,
): Section[] {
  return sections.map((s) =>
    s.id === sectionId ? { ...s, icons: { ...icons } } : s,
  );
}

/** @deprecated */
export const createSceneMetaId = createSectionMetaId;
/** @deprecated */
export const readSceneMetasByDocument = readSectionMetasByDocument;
/** @deprecated */
export const mergeScenesWithMetas = mergeSectionsWithMetas;
/** @deprecated */
export const saveSceneMetasForDocument = async (input: {
  projectId: ProjectId;
  documentId: ChapterId;
  scenes: Section[];
  collapsedNumbers: Set<number>;
}) =>
  saveSectionMetasForDocument({
    projectId: input.projectId,
    documentId: input.documentId,
    sections: input.scenes,
    collapsedNumbers: input.collapsedNumbers,
  });
/** @deprecated */
export const withSceneStatus = withSectionStatus;
/** @deprecated */
export const withSceneMemo = withSectionMemo;
