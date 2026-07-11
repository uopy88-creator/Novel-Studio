/**
 * =============================================================================
 * 백업 파일 다운로드 / 파싱
 * =============================================================================
 */

import {
  exportWorkDataBackup,
  importWorkDataBackup,
  type WorkDataBackupSnapshot,
} from "@/lib/storage/backup";

export interface NovelStudioBackupFile {
  version: 1;
  exportedAt: string;
  app: "novel-studio";
  data: WorkDataBackupSnapshot;
}

export function buildBackupFile(): NovelStudioBackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "novel-studio",
    data: exportWorkDataBackup(),
  };
}

/** JSON 백업 파일을 내려받는다. */
export function downloadBackupFile(): void {
  const file = buildBackupFile();
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `novel-studio-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(raw: string): NovelStudioBackupFile {
  const parsed = JSON.parse(raw) as Partial<NovelStudioBackupFile>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("백업 파일 형식이 올바르지 않습니다.");
  }
  if (parsed.app && parsed.app !== "novel-studio") {
    throw new Error("Novel Studio 백업 파일이 아닙니다.");
  }
  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("백업 데이터(data)가 없습니다.");
  }
  return {
    version: 1,
    exportedAt:
      typeof parsed.exportedAt === "string"
        ? parsed.exportedAt
        : new Date().toISOString(),
    app: "novel-studio",
    data: parsed.data as WorkDataBackupSnapshot,
  };
}

/** 백업을 LocalStorage 에 복원한다. 클라우드 데이터는 덮어쓰지 않는다. */
export function restoreBackupFile(file: NovelStudioBackupFile): void {
  importWorkDataBackup(file.data);
}
