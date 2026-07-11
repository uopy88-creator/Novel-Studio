"use client";

/**
 * =============================================================================
 * ExportOptionsForm — 형식 · 범위 · 옵션 · Scene 선택
 * =============================================================================
 */

import type { Scene } from "@/features/manuscript/types/scene";
import type {
  ExportFormat,
  ExportOptions,
  ExportScope,
} from "@/features/export/types/export-options";
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_SCOPE_LABELS,
} from "@/features/export/types/export-options";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface ExportOptionsFormProps {
  format: ExportFormat;
  scope: ExportScope;
  options: ExportOptions;
  scenes: Scene[];
  selectedSceneIds: string[];
  /** Document 미선택 시 manuscript/scenes 비활성 */
  hasDocument: boolean;
  onFormatChange: (format: ExportFormat) => void;
  onScopeChange: (scope: ExportScope) => void;
  onOptionsChange: (options: ExportOptions) => void;
  onSelectedScenesChange: (ids: string[]) => void;
}

const FORMATS: ExportFormat[] = ["txt", "docx", "pdf"];
const SCOPES: ExportScope[] = ["manuscript", "scenes", "project"];

export function ExportOptionsForm({
  format,
  scope,
  options,
  scenes,
  selectedSceneIds,
  hasDocument,
  onFormatChange,
  onScopeChange,
  onOptionsChange,
  onSelectedScenesChange,
}: ExportOptionsFormProps) {
  const selectedSet = new Set(selectedSceneIds);

  function toggleScene(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedScenesChange([...next]);
  }

  function selectAllScenes() {
    onSelectedScenesChange(scenes.map((s) => s.id));
  }

  function clearScenes() {
    onSelectedScenesChange([]);
  }

  return (
    <div className="flex flex-col gap-ns-5">
      <fieldset>
        <legend className="mb-ns-2 text-ns-sm font-medium text-ns-ink">
          형식
        </legend>
        <div className="flex flex-wrap gap-ns-2">
          {FORMATS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={format === item ? "primary" : "secondary"}
              onClick={() => onFormatChange(item)}
            >
              {EXPORT_FORMAT_LABELS[item]}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-ns-2 text-ns-sm font-medium text-ns-ink">
          Export 대상
        </legend>
        <div className="flex flex-col gap-ns-1">
          {SCOPES.map((item) => {
            const disabled =
              (item === "manuscript" || item === "scenes") && !hasDocument;
            return (
              <label
                key={item}
                className={cn(
                  "flex min-h-ns-touch cursor-pointer items-center gap-ns-3 rounded-ns-lg px-ns-2 py-ns-1",
                  "hover:bg-ns-muted/50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="export-scope"
                  value={item}
                  checked={scope === item}
                  disabled={disabled}
                  onChange={() => onScopeChange(item)}
                  className="accent-[var(--ns-accent)]"
                />
                <span className="text-ns-sm text-ns-ink">
                  {EXPORT_SCOPE_LABELS[item]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {scope === "scenes" ? (
        <div className="rounded-ns-lg border border-ns-border bg-ns-muted/30 px-ns-3 py-ns-3">
          <div className="mb-ns-2 flex items-center justify-between gap-ns-2">
            <p className="text-ns-sm font-medium text-ns-ink">Scene 선택</p>
            <div className="flex gap-ns-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={selectAllScenes}
              >
                전체
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearScenes}
              >
                해제
              </Button>
            </div>
          </div>
          {scenes.length === 0 ? (
            <p className="text-ns-xs text-ns-ink-tertiary">
              이 원고에 Scene이 없습니다.
            </p>
          ) : (
            <ul className="max-h-40 space-y-ns-1 overflow-y-auto">
              {scenes.map((scene) => {
                const label = scene.title.trim()
                  ? `#${scene.number} ${scene.title}`
                  : `#${scene.number}`;
                return (
                  <li key={scene.id}>
                    <Checkbox
                      label={label}
                      checked={selectedSet.has(scene.id)}
                      onChange={() => toggleScene(scene.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-ns-2 text-ns-sm font-medium text-ns-ink">
          옵션
        </legend>
        <div className="flex flex-col gap-ns-1">
          <Checkbox
            label="장면 구분 포함"
            description="#1 #2 … 구분자를 본문에 남깁니다."
            checked={options.includeSceneDelimiters}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                includeSceneDelimiters: e.target.checked,
              })
            }
          />
          <Checkbox
            label="장면 메모 제외"
            description="작가 전용 Scene 메모를 내보내지 않습니다."
            checked={options.excludeSceneMemos}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                excludeSceneMemos: e.target.checked,
              })
            }
          />
          <Checkbox
            label="Writing Vault 제외"
            description="Writing Vault 항목을 부록으로 붙이지 않습니다."
            checked={options.excludeWritingVault}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                excludeWritingVault: e.target.checked,
              })
            }
          />
          <Checkbox
            label="Inspiration 주석 포함"
            description="Inspiration 노트를 부록으로 붙입니다."
            checked={options.includeInspirationNotes}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                includeInspirationNotes: e.target.checked,
              })
            }
          />
        </div>
      </fieldset>
    </div>
  );
}
