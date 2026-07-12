"use client";

/**
 * =============================================================================
 * ExportModal — TXT / DOCX / PDF 내보내기
 * -----------------------------------------------------------------------------
 * Manuscript 헤더의 「Export」에서 연다.
 * PC · Mac · iPad 모두 downloadBlob 경로로 저장한다.
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import type { Section } from "@/features/manuscript/types/section";
import type { ChapterId, ProjectId } from "@/types/ids";
import type {
  ExportFormat,
  ExportOptions,
  ExportScope,
} from "@/features/export/types/export-options";
import { DEFAULT_EXPORT_OPTIONS } from "@/features/export/types/export-options";
import { ExportOptionsForm } from "@/features/export/components/ExportOptionsForm";
import { useUserSettings } from "@/features/settings";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  projectId: ProjectId;
  chapterId: ChapterId | null;
  /** 에디터 최신 본문 (dirty 반영) */
  liveContent: string;
  /** Section 목록 (scope=scenes 선택 UI용 — 값 키는 하위 호환) */
  scenes: Section[];
}

export function ExportModal({
  open,
  onClose,
  projectId,
  chapterId,
  liveContent,
  scenes,
}: ExportModalProps) {
  const { settings } = useUserSettings();
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [scope, setScope] = useState<ExportScope>("manuscript");
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaults = settings.exportDefaults;
    setFormat(defaults.format);
    setScope(
      chapterId
        ? defaults.scope === "project"
          ? "manuscript"
          : defaults.scope
        : "project",
    );
    setOptions({
      includeSceneDelimiters: defaults.includeSceneDelimiters,
      excludeSceneMemos: defaults.excludeSceneMemos,
      excludeWritingVault: defaults.excludeWritingVault,
      includeInspirationNotes: defaults.includeInspirationNotes,
    });
    setSelectedSceneIds(scenes.map((s) => s.id));
    setError(null);
    setBusy(false);
    // scenes 는 열릴 때의 스냅샷만 사용 (매 렌더 리셋 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open 전환 시에만 초기화
  }, [open, chapterId, settings.exportDefaults]);

  const canExport = useMemo(() => {
    if (busy) return false;
    if (scope === "project") return true;
    if (!chapterId) return false;
    if (scope === "scenes") return selectedSceneIds.length > 0;
    return true;
  }, [busy, scope, chapterId, selectedSceneIds.length]);

  async function handleExport() {
    setBusy(true);
    setError(null);
    try {
      // 페이로드·포맷 생성기는 클릭 시에만 로드 (docx/jspdf 분리)
      const [{ buildExportPayload }, { runExport }] = await Promise.all([
        import("@/features/export/lib/build-export-payload"),
        import("@/features/export/lib/run-export"),
      ]);
      const payload = await buildExportPayload({
        projectId,
        chapterId,
        scope,
        selectedSceneIds,
        liveContent: scope === "project" ? undefined : liveContent,
        options,
      });
      await runExport(format, payload);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Export에 실패했습니다.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export"
      description="원고를 TXT · DOCX · PDF 로 내보냅니다. 자동 저장과는 별개입니다."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canExport}
            onClick={() => {
              void handleExport();
            }}
          >
            {busy ? "내보내는 중…" : "다운로드"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-ns-4">
        {error ? (
          <p
            className="rounded-ns-lg border border-rose-200 bg-rose-50 px-ns-3 py-ns-2 text-ns-sm text-rose-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <ExportOptionsForm
          format={format}
          scope={scope}
          options={options}
          scenes={scenes}
          selectedSceneIds={selectedSceneIds}
          hasDocument={Boolean(chapterId)}
          onFormatChange={setFormat}
          onScopeChange={setScope}
          onOptionsChange={setOptions}
          onSelectedScenesChange={setSelectedSceneIds}
        />
      </div>
    </Modal>
  );
}
