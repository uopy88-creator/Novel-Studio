/**
 * =============================================================================
 * Manuscript Version Storage — 명시적 스냅샷 (자동 저장과 별개)
 * -----------------------------------------------------------------------------
 * 로그인 후: Supabase 단일 소스. LocalStorage 는 성공 후 백업만.
 * =============================================================================
 */

import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import type { ChapterId, ProjectId } from "@/types/ids";
import {
  isSupabaseDataMode,
  requireCloudDb,
} from "@/database/supabase/cloud-mode";
import {
  cloudGetManuscriptVersion,
  cloudInsertManuscriptVersion,
  cloudListManuscriptVersions,
  cloudUpdateManuscriptVersionName,
} from "@/database/supabase/manuscript-versions-repo";
import {
  getManuscriptByChapterId,
  saveManuscriptContent,
} from "@/features/manuscript/lib/manuscript-storage";
import { countCharsWithoutSpaces } from "@/lib/stats";
import { stripManuscriptMarkup } from "@/features/manuscript/lib/manuscript-markup";
import { MANUSCRIPT_VERSIONS_STORAGE_KEY } from "@/lib/storage/keys";
import { writeWorkDataBackup } from "@/lib/storage/backup";
import { nowIso, readJsonArray, writeJsonArray } from "@/lib/storage/browser";

export { MANUSCRIPT_VERSIONS_STORAGE_KEY };

function readLocalVersions(): ManuscriptVersion[] {
  return readJsonArray<ManuscriptVersion>(MANUSCRIPT_VERSIONS_STORAGE_KEY);
}

function writeLocalVersions(versions: ManuscriptVersion[]): void {
  writeJsonArray(MANUSCRIPT_VERSIONS_STORAGE_KEY, versions);
}

function backupVersions(versions: ManuscriptVersion[]): void {
  writeWorkDataBackup(MANUSCRIPT_VERSIONS_STORAGE_KEY, versions);
}

function sortDesc(versions: ManuscriptVersion[]): ManuscriptVersion[] {
  return [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function listManuscriptVersions(
  projectId: ProjectId,
  chapterId: ChapterId,
): Promise<ManuscriptVersion[]> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const versions = await cloudListManuscriptVersions(projectId, chapterId);
    try {
      const others = readLocalVersions().filter(
        (v) => !(v.projectId === projectId && v.chapterId === chapterId),
      );
      backupVersions([...others, ...versions]);
    } catch {
      // 백업 실패는 목록 조회 성공에 영향 없음
    }
    return versions;
  }

  return sortDesc(
    readLocalVersions().filter(
      (v) => v.projectId === projectId && v.chapterId === chapterId,
    ),
  );
}

/**
 * 현재 원고를 Snapshot으로 저장.
 * 자동 저장 타이머와 무관하게, 전달된 content 를 그대로 기록한다.
 */
export async function saveManuscriptVersionSnapshot(params: {
  projectId: ProjectId;
  chapterId: ChapterId;
  content: string;
  name?: string;
}): Promise<ManuscriptVersion> {
  const { projectId, chapterId, content, name = "" } = params;
  const timestamp = nowIso();
  const plainText = stripManuscriptMarkup(content);
  const wordCount = countCharsWithoutSpaces(plainText);

  // manuscript 행이 없으면 먼저 생성 (FK)
  let manuscript = await getManuscriptByChapterId(projectId, chapterId);
  if (!manuscript) {
    manuscript = await saveManuscriptContent({
      projectId,
      chapterId,
      content,
    });
  }

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudListManuscriptVersions(projectId, chapterId);
    const nextNumber =
      existing.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;

    const version: ManuscriptVersion = {
      id: crypto.randomUUID(),
      projectId,
      chapterId,
      manuscriptId: manuscript.id,
      versionNumber: nextNumber,
      name: name.trim(),
      content,
      plainText,
      wordCount,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await cloudInsertManuscriptVersion(version);

    try {
      const refreshed = await cloudListManuscriptVersions(projectId, chapterId);
      const others = readLocalVersions().filter(
        (v) => !(v.projectId === projectId && v.chapterId === chapterId),
      );
      backupVersions([...others, ...refreshed]);
    } catch {
      // ignore backup failure
    }

    return version;
  }

  const local = readLocalVersions();
  const siblings = local.filter(
    (v) => v.projectId === projectId && v.chapterId === chapterId,
  );
  const nextNumber =
    siblings.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;

  const version: ManuscriptVersion = {
    id: crypto.randomUUID(),
    projectId,
    chapterId,
    manuscriptId: manuscript.id,
    versionNumber: nextNumber,
    name: name.trim(),
    content,
    plainText,
    wordCount,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeLocalVersions([version, ...local]);
  return version;
}

export async function renameManuscriptVersion(
  versionId: string,
  name: string,
): Promise<ManuscriptVersion | null> {
  const trimmed = name.trim();
  const timestamp = nowIso();

  if (isSupabaseDataMode()) {
    await requireCloudDb();
    const existing = await cloudGetManuscriptVersion(versionId);
    if (!existing) return null;

    await cloudUpdateManuscriptVersionName(versionId, trimmed, timestamp);
    const updated: ManuscriptVersion = {
      ...existing,
      name: trimmed,
      updatedAt: timestamp,
    };

    try {
      const refreshed = await cloudListManuscriptVersions(
        existing.projectId,
        existing.chapterId,
      );
      const others = readLocalVersions().filter(
        (v) =>
          !(
            v.projectId === existing.projectId &&
            v.chapterId === existing.chapterId
          ),
      );
      backupVersions([...others, ...refreshed]);
    } catch {
      // ignore
    }

    return updated;
  }

  const local = readLocalVersions();
  const index = local.findIndex((v) => v.id === versionId);
  if (index < 0) return null;

  const updated: ManuscriptVersion = {
    ...local[index],
    name: trimmed,
    updatedAt: timestamp,
  };
  const next = [...local];
  next[index] = updated;
  writeLocalVersions(next);
  return updated;
}

export async function getManuscriptVersion(
  versionId: string,
): Promise<ManuscriptVersion | null> {
  if (isSupabaseDataMode()) {
    await requireCloudDb();
    return cloudGetManuscriptVersion(versionId);
  }
  return readLocalVersions().find((v) => v.id === versionId) ?? null;
}
